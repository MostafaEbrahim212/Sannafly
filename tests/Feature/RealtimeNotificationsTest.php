<?php

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Permission;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\Role;
use App\Models\ShippingZone;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

uses(RefreshDatabase::class);

function makeRealtimeAdmin(): User
{
    $user = User::factory()->create(['status' => 'active']);
    $role = Role::create([
        'name' => 'Realtime Admin',
        'slug' => 'admin',
        'is_system' => true,
    ]);
    $perm = Permission::firstOrCreate(
        ['slug' => 'dashboard.access'],
        ['name' => 'dashboard.access', 'group' => 'dashboard']
    );
    $role->permissions()->sync([$perm->id]);
    $user->roles()->sync([$role->id]);

    return $user;
}

it('creates database notifications for admins and customers on order placement and status transitions', function (): void {
    $admin = makeRealtimeAdmin();
    $customer = Customer::factory()->create();
    $regular = PriceType::query()->firstOrCreate(['slug' => 'regular'], ['name' => 'Regular']);
    $product = Product::factory()->create(['stock_quantity' => 10, 'low_stock_threshold' => 3]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);
    $pm = PaymentMethod::query()->firstOrCreate(['driver' => 'cod'], ['name' => 'COD', 'code' => 'cod', 'is_active' => true]);
    ShippingZone::create(['name' => 'Default', 'cities' => ['Cairo'], 'rate' => '25.0000', 'is_default' => true, 'is_active' => true]);

    Auth::guard('customer')->setUser($customer);

    $order = app(OrderService::class)->placeOrder(
        customerData: [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_email' => $customer->email,
            'customer_phone' => '01000000001',
            'shipping_address' => ['city' => 'Cairo', 'address' => '10 Nile St'],
        ],
        cartItems: [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
        paymentMethodId: $pm->id,
    );

    expect($order->customer_id)->toBe($customer->id);
    expect($admin->unreadNotifications()->count())->toBe(1);
    expect($customer->unreadNotifications()->count())->toBe(1);

    app(OrderService::class)->transitionStatus($order, 'confirmed');
    expect($admin->unreadNotifications()->count())->toBe(2);
    expect($customer->unreadNotifications()->count())->toBe(2);

    $this->actingAs($admin, 'web')
        ->get('/admin/realtime/feed')
        ->assertOk()
        ->assertJsonPath('unread_count', 2)
        ->assertJsonStructure(['unread_count', 'notifications', 'admin_alerts', 'dashboard_pulse']);

    $this->actingAs($customer, 'customer')
        ->get('/account/realtime/feed')
        ->assertOk()
        ->assertJsonPath('unread_count', 2);

    $this->get("/orders/{$order->order_number}/live-status")
        ->assertOk()
        ->assertJsonPath('status', 'confirmed')
        ->assertJsonPath('order_number', $order->order_number);
});

it('notifies admins on low stock and new inquiries, and supports notification management actions', function (): void {
    $admin = makeRealtimeAdmin();
    $product = Product::factory()->create(['stock_quantity' => 5, 'low_stock_threshold' => 3, 'track_inventory' => true]);

    app(InventoryService::class)->adjustStock($product, -3, 'adjustment', null, 'Test drop');

    expect($admin->unreadNotifications()->where('data->category', 'inventory')->count())->toBe(1);

    $this->post('/inquiries', [
        'name' => 'Ali Hassan',
        'email' => 'ali@example.com',
        'message' => 'Need bulk pricing please',
    ])->assertRedirect();

    expect($admin->unreadNotifications()->where('data->category', 'inquiry')->count())->toBe(1);

    $this->actingAs($admin, 'web')
        ->get('/admin/notifications')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Notifications/Index')
            ->where('unreadCount', 2)
        );

    $this->actingAs($admin, 'web')
        ->post('/admin/notifications/read-all')
        ->assertRedirect();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(0);

    $this->actingAs($admin, 'web')
        ->delete('/admin/notifications')
        ->assertRedirect();

    expect($admin->fresh()->notifications()->count())->toBe(0);
});

it('blocks customers from admin realtime feed and notifications', function (): void {
    $customer = Customer::factory()->create();

    $this->actingAs($customer, 'customer')->get('/admin/notifications')->assertForbidden();
    $this->actingAs($customer, 'customer')->get('/admin/realtime/feed')->assertForbidden();
});
