<?php

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('prevents IDOR on customer addresses between customer A and customer B', function () {
    $customerA = Customer::factory()->create();
    $customerB = Customer::factory()->create();

    $address = CustomerAddress::query()->create([
        'customer_id' => $customerA->id,
        'label' => 'Home',
        'recipient_name' => 'Customer A',
        'phone' => '01011111111',
        'city' => 'Cairo',
        'street' => '1 Secret St',
        'is_default' => true,
    ]);

    $this->actingAs($customerB, 'customer')
        ->delete("/profile/addresses/{$address->id}")
        ->assertForbidden();

    expect(CustomerAddress::query()->find($address->id))->not->toBeNull();
});

it('sanitizes CSV formula injection payloads on product export', function () {
    $admin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    Product::factory()->create(['name' => '=CMD|calc!A0', 'sku' => '+1+1']);

    $response = $this->actingAs($admin)->get('/admin/import-export/export?format=csv');
    $response->assertOk();
    $content = $response->streamedContent();

    expect($content)->toContain("'=CMD|calc!A0");
    expect($content)->toContain("'+1+1");
});

it('rejects malicious SVG/script uploads on product image validation', function () {
    $admin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    $svg = UploadedFile::fake()->createWithContent('evil.svg', '<svg><script>alert(1)</script></svg>');

    $this->actingAs($admin)->post('/admin/products', [
        'name' => 'Safe Product',
        'sku' => 'SAFE-1',
        'status' => 'draft',
        'visibility' => 'public',
        'images' => [$svg],
    ])->assertSessionHasErrors('images.0');
});

it('encrypts PaymentMethod config at rest so raw DB value is not plaintext', function () {
    $mf = PaymentMethod::query()->where('driver', 'myfatoorah')->firstOrFail();
    $mf->update(['config' => ['api_key' => 'MY_SUPER_SECRET_KEY_12345', 'sandbox' => true]]);

    $rawConfig = DB::table('payment_methods')->where('id', $mf->id)->value('config');
    expect($rawConfig)->not->toContain('MY_SUPER_SECRET_KEY_12345');
});

it('regenerates session ID on customer login and logout to prevent session fixation', function () {
    $customer = Customer::factory()->create(['email' => 'fix@example.com', 'password' => 'Password123']);

    $this->get('/login')->assertOk();
    $beforeLoginId = session()->getId();

    $this->post('/login', ['email' => 'fix@example.com', 'password' => 'Password123'])->assertRedirect();
    $afterLoginId = session()->getId();

    expect($afterLoginId)->not->toBe($beforeLoginId);

    $this->post('/logout')->assertRedirect();
    expect(session()->getId())->not->toBe($afterLoginId);
});
