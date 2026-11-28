<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\LicenseService;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('rejects arbitrary unsigned license keys and accepts signed offline keys', function (): void {
    $this->seed(RbacSeeder::class);
    $admin = User::factory()->create(['status' => 'active']);
    $role = Role::where('slug', 'super-admin')->firstOrFail();
    $admin->roles()->sync([$role->id]);

    // Unsigned random key must be rejected
    $this->actingAs($admin, 'web')
        ->post('/admin/license/activate', [
            'license_key' => 'AAAA-BBBB-CCCC-DDDD',
            'type' => 'single',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(app(LicenseService::class)->status()['status'])->toBe('inactive');

    // Signed key for matching type must be accepted
    $signedKey = LicenseService::generateSignedKey('single');

    $this->actingAs($admin, 'web')
        ->post('/admin/license/activate', [
            'license_key' => $signedKey,
            'type' => 'single',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(app(LicenseService::class)->status()['status'])->toBe('active');
});

it('renders customer details page /admin/customers/{customer} with RBAC enforcement', function (): void {
    $this->seed(RbacSeeder::class);
    $customer = Customer::factory()->create(['name' => 'Test Buyer']);
    Order::factory()->create(['customer_id' => $customer->id, 'order_number' => 'ORD-CUST-100']);

    $this->actingAs($customer, 'customer')
        ->get("/admin/customers/{$customer->id}")
        ->assertForbidden();

    $admin = User::factory()->create(['status' => 'active']);
    $role = Role::where('slug', 'super-admin')->firstOrFail();
    $admin->roles()->sync([$role->id]);

    $this->actingAs($admin, 'web')
        ->get("/admin/customers/{$customer->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Customers/Show')
            ->where('customer.id', $customer->id)
            ->has('orders', 1)
        );
});

it('renders shipping label and product print pages with barcode support', function (): void {
    $this->seed(RbacSeeder::class);
    $admin = User::factory()->create(['status' => 'active']);
    $role = Role::where('slug', 'super-admin')->firstOrFail();
    $admin->roles()->sync([$role->id]);

    $order = Order::factory()->create(['order_number' => 'ORD-LBL-1', 'tracking_number' => 'AWB-998877']);
    $product = Product::factory()->create(['sku' => 'SKU-PRT-1', 'barcode' => '1234567890']);

    $this->actingAs($admin, 'web')
        ->get("/admin/orders/{$order->id}/label")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Orders/ShippingLabel'));

    $this->actingAs($admin, 'web')
        ->get("/admin/print/products/{$product->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Print/ProductPrint'));
});
