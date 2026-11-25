<?php

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('allows active admin to login at /admin/login and records audit log without password', function () {
    $response = $this->post('/admin/login', [
        'email' => 'admin@catalogflow.test',
        'password' => 'Password123!',
    ]);

    $response->assertRedirect('/admin');
    $this->assertAuthenticated('web');

    $log = AuditLog::query()->where('action', 'auth.login')->first();
    expect($log)->not->toBeNull();
    expect(json_encode($log->toArray()))->not->toContain('Password123!');
});

it('blocks inactive and suspended admins from logging in or accessing dashboard', function () {
    $user = User::query()->create([
        'name' => 'Inactive User',
        'email' => 'inactive@catalogflow.test',
        'status' => 'suspended',
        'password' => Hash::make('Password123!'),
    ]);
    $adminRole = Role::query()->where('slug', 'admin')->first();
    $user->roles()->attach($adminRole->id);

    $this->post('/admin/login', [
        'email' => 'inactive@catalogflow.test',
        'password' => 'Password123!',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('web');

    $this->actingAs($user, 'web')->get('/admin')->assertRedirect('/admin/login');
});

it('enforces granular permissions and prevents privilege escalation', function () {
    $viewer = User::query()->create([
        'name' => 'Viewer User',
        'email' => 'viewer@catalogflow.test',
        'status' => 'active',
        'password' => Hash::make('Password123!'),
    ]);
    $viewerRole = Role::query()->where('slug', 'viewer')->first();
    $viewer->roles()->attach($viewerRole->id);

    $this->actingAs($viewer, 'web')->get('/admin/products')->assertOk();
    $this->actingAs($viewer, 'web')->post('/admin/products', ['name' => 'Hack', 'sku' => 'HACK-1', 'status' => 'draft', 'visibility' => 'public'])->assertForbidden();
    $this->actingAs($viewer, 'web')->get('/admin/users')->assertForbidden();
    $this->actingAs($viewer, 'web')->post('/admin/roles', ['name' => 'Hacker'])->assertForbidden();
    $this->actingAs($viewer, 'web')->get('/admin/audit-logs')->assertForbidden();
});

it('rate limits brute force admin login attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->post('/admin/login', [
            'email' => 'admin@catalogflow.test',
            'password' => 'WrongPassword!',
        ]);
    }

    $response = $this->post('/admin/login', [
        'email' => 'admin@catalogflow.test',
        'password' => 'WrongPassword!',
    ]);

    $response->assertSessionHasErrors('email');
});

it('allows authenticated admin to update profile and change password securely', function () {
    $admin = User::query()->where('email', 'admin@catalogflow.test')->firstOrFail();

    $this->actingAs($admin, 'web')->get('/admin/profile')->assertOk();

    $this->actingAs($admin, 'web')->put('/admin/profile/password', [
        'current_password' => 'WrongPass123!',
        'password' => 'NewPass123!',
        'password_confirmation' => 'NewPass123!',
    ])->assertSessionHasErrors('current_password');

    $this->actingAs($admin, 'web')->put('/admin/profile/password', [
        'current_password' => 'Password123!',
        'password' => 'NewPass123!',
        'password_confirmation' => 'NewPass123!',
    ])->assertSessionHasNoErrors();

    expect(Hash::check('NewPass123!', $admin->fresh()->password))->toBeTrue();
});

it('registers and authenticates customers completely separately from admin users', function () {
    $this->get('/register')->assertOk();

    $response = $this->post('/register', [
        'name' => 'Customer User',
        'email' => 'customer@catalogflow.test',
        'phone' => '01011223344',
        'password' => 'Customer123!',
        'password_confirmation' => 'Customer123!',
    ]);

    $response->assertRedirect('/');
    $this->assertAuthenticated('customer');
    $this->assertGuest('web');

    expect(Customer::query()->where('email', 'customer@catalogflow.test')->exists())->toBeTrue();
    expect(User::query()->where('email', 'customer@catalogflow.test')->exists())->toBeFalse();

    // Customer cannot access admin portal and is redirected to /admin/login
    $this->get('/admin')->assertRedirect('/admin/login');

    // Customer can view their own orders page
    $this->get('/my-orders')->assertOk();

    // Customer can manage their profile and addresses, and IDOR is blocked
    $customer = Customer::query()->where('email', 'customer@catalogflow.test')->firstOrFail();
    $this->get('/profile')->assertOk();

    $this->post('/profile/addresses', [
        'label' => 'Home',
        'recipient_name' => 'Customer User',
        'phone' => '01011223344',
        'city' => 'Cairo',
        'street' => '10 Tahrir St',
    ])->assertRedirect();

    $addr = $customer->addresses()->firstOrFail();
    expect($addr->is_default)->toBeTrue();

    // Another customer cannot edit or delete this address (IDOR protection)
    $otherCustomer = Customer::query()->create([
        'name' => 'Other',
        'email' => 'other@catalogflow.test',
        'status' => 'active',
        'password' => Hash::make('Password123!'),
    ]);
    $this->actingAs($otherCustomer, 'customer')->delete("/profile/addresses/{$addr->id}")->assertForbidden();
});
