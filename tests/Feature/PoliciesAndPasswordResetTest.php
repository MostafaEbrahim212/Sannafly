<?php

use App\Models\Customer;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('renders all legal policy pages and includes them in sitemap', function () {
    $this->get('/policies/privacy-policy')->assertOk();
    $this->get('/policies/terms')->assertOk();
    $this->get('/policies/refund-policy')->assertOk();
    $this->get('/policies/unknown-page')->assertNotFound();

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertSee('/policies/privacy-policy')
        ->assertSee('/policies/terms')
        ->assertSee('/policies/refund-policy');
});

it('allows customer to request a reset link and reset their password', function () {
    Notification::fake();

    $customer = Customer::query()->create([
        'name' => 'Reset User',
        'email' => 'reset@catalogflow.test',
        'phone' => '01099999999',
        'password' => 'oldpassword123',
        'status' => 'active',
    ]);

    $this->get('/forgot-password')->assertOk();
    $this->post('/forgot-password', ['email' => 'reset@catalogflow.test'])->assertRedirect();

    $token = Password::broker('customers')->createToken($customer);

    $this->get("/reset-password/{$token}?email=reset@catalogflow.test")->assertOk();
    $this->post('/reset-password', [
        'token' => $token,
        'email' => 'reset@catalogflow.test',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ])->assertRedirect('/login');

    $customer->refresh();
    expect(Hash::check('newpassword123', $customer->password))->toBeTrue();
});

it('allows admin to request a reset link and reset their password', function () {
    Notification::fake();

    $admin = User::query()->where('email', 'admin@catalogflow.test')->firstOrFail();

    $this->get('/admin/forgot-password')->assertOk();
    $this->post('/admin/forgot-password', ['email' => $admin->email])->assertRedirect();

    $token = Password::broker('users')->createToken($admin);

    $this->get("/admin/reset-password/{$token}?email=".urlencode($admin->email))->assertOk();
    $this->post('/admin/reset-password', [
        'token' => $token,
        'email' => $admin->email,
        'password' => 'newadminpass123',
        'password_confirmation' => 'newadminpass123',
    ])->assertRedirect('/admin/login');

    $admin->refresh();
    expect(Hash::check('newadminpass123', $admin->password))->toBeTrue();
});

it('runs catalog preflight command successfully', function () {
    $this->artisan('catalog:preflight')->assertSuccessful();
});
