<?php

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ShippingZone;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@Sannafly.test')->firstOrFail();
    $this->customer = Customer::query()->create([
        'name' => 'Test Customer',
        'email' => 'buyer@Sannafly.test',
        'phone' => '01000000001',
        'password' => 'password123',
        'status' => 'active',
    ]);
    $this->product = Product::query()->create([
        'name' => 'Mechanical Keyboard',
        'slug' => 'mechanical-keyboard',
        'sku' => 'KB-MECH-1',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 25,
    ]);
    $regularPriceType = \App\Models\PriceType::query()->where('slug', 'regular')->firstOrFail();
    $this->product->prices()->create([
        'price_type_id' => $regularPriceType->id,
        'amount' => '100.0000',
        'min_quantity' => 1,
    ]);
});

it('applies valid coupons and calculates shipping zone rates on checkout', function () {
    Notification::fake();

    Coupon::query()->create([
        'code' => 'SAVE20',
        'type' => 'percent',
        'value' => 20,
        'min_order_amount' => 50,
        'is_active' => true,
    ]);

    ShippingZone::query()->create([
        'name' => 'Cairo & Giza',
        'cities' => ['Cairo', 'Giza'],
        'rate' => 15,
        'free_shipping_threshold' => 200,
        'is_default' => false,
        'is_active' => true,
    ]);

    $pm = PaymentMethod::query()->where('is_active', true)->firstOrFail();

    $this->actingAs($this->customer, 'customer')
        ->post('/cart/add', ['product_id' => $this->product->id, 'quantity' => 1])
        ->assertRedirect();

    $this->actingAs($this->customer, 'customer')
        ->post('/cart/coupon', ['code' => 'SAVE20'])
        ->assertRedirect();

    $this->actingAs($this->customer, 'customer')
        ->post('/checkout', [
            'customer_name' => 'Test Customer',
            'customer_email' => 'buyer@Sannafly.test',
            'customer_phone' => '01000000001',
            'shipping_address' => ['city' => 'Cairo', 'street' => '10 Tahrir St'],
            'payment_method_id' => $pm->id,
        ])
        ->assertRedirect();

    $order = Order::query()->latest('id')->firstOrFail();
    expect((float) $order->subtotal)->toBe(100.0);
    expect((float) $order->discount_total)->toBe(20.0);
    expect((float) $order->shipping_total)->toBe(15.0);
    expect((float) $order->grand_total)->toBe(95.0);
    expect($order->coupon_code)->toBe('SAVE20');
    expect($order->shipping_zone_name)->toBe('Cairo & Giza');

    Notification::assertSentOnDemand(\App\Notifications\OrderStatusNotification::class);
});

it('renders admin order detail and printable invoice', function () {
    $pm = PaymentMethod::query()->where('is_active', true)->firstOrFail();
    $order = Order::query()->create([
        'order_number' => 'ORD-TEST-INV1',
        'customer_id' => $this->customer->id,
        'customer_name' => 'Test Customer',
        'customer_phone' => '01000000001',
        'shipping_address' => ['city' => 'Cairo', 'street' => '10 Tahrir St'],
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'payment_method_id' => $pm->id,
        'subtotal' => 100,
        'grand_total' => 100,
        'currency' => 'USD',
    ]);

    $this->actingAs($this->admin)->get("/admin/orders/{$order->id}")->assertOk();
    $this->actingAs($this->admin)->get("/admin/orders/{$order->id}/invoice")->assertOk();
});

it('toggles customer wishlist and submits product reviews', function () {
    $this->actingAs($this->customer, 'customer')
        ->post('/wishlist/toggle', ['product_id' => $this->product->id])
        ->assertRedirect();

    $this->actingAs($this->customer, 'customer')
        ->get('/wishlist')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Wishlist')->has('products', 1));

    $this->actingAs($this->customer, 'customer')
        ->post("/products/{$this->product->id}/reviews", [
            'rating' => 5,
            'title' => 'Awesome keyboard',
            'comment' => 'Great build quality!',
        ])
        ->assertRedirect();

    expect($this->product->reviews()->count())->toBe(1);
});
