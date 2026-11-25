<?php

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StockMovement;
use App\Services\InventoryService;
use App\Services\OrderService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('adjusts stock transactionally and prevents negative stock when disallowed', function () {
    $product = Product::query()->create([
        'name' => 'USB Hub',
        'slug' => 'usb-hub',
        'sku' => 'USB-HUB-1',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 5,
        'allow_negative_stock' => false,
    ]);

    /** @var InventoryService $inv */
    $inv = app(InventoryService::class);
    $inv->adjustStock($product, 10, 'adjustment', null, 'Restock');
    expect($product->fresh()->stock_quantity)->toBe(15);
    expect(StockMovement::query()->where('product_id', $product->id)->count())->toBe(1);

    expect(fn () => $inv->adjustStock($product, -20, 'sale'))
        ->toThrow(RuntimeException::class);

    expect($product->fresh()->stock_quantity)->toBe(15);
});

it('places order atomically, enforces idempotency, and releases stock on cancel', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $pm = PaymentMethod::query()->where('code', 'cod')->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Desk Lamp',
        'slug' => 'desk-lamp',
        'sku' => 'LAMP-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 10,
        'track_inventory' => true,
    ]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '45.0000',
        'currency' => 'USD',
        'min_quantity' => 1,
    ]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);

    $order1 = $orders->placeOrder(
        ['customer_name' => 'Omar', 'customer_phone' => '01012345678'],
        [['product_id' => $product->id, 'quantity' => 3]],
        $pm->id,
        'idem-key-123'
    );

    // Duplicate idempotency key returns same order without deducting stock twice
    $order2 = $orders->placeOrder(
        ['customer_name' => 'Omar', 'customer_phone' => '01012345678'],
        [['product_id' => $product->id, 'quantity' => 3]],
        $pm->id,
        'idem-key-123'
    );

    expect($order1->id)->toBe($order2->id);
    expect((string) $order1->grand_total)->toBe('135.0000');
    expect($product->fresh()->stock_quantity)->toBe(7);

    // Cancel releases stock back to 10
    $orders->cancelOrder($order1);
    expect($product->fresh()->stock_quantity)->toBe(10);
    expect($order1->fresh()->status)->toBe('cancelled');

    // Terminal state: cancelled -> delivered must be blocked
    expect(fn () => $orders->transitionStatus($order1->fresh(), 'delivered'))
        ->toThrow(RuntimeException::class);
});

it('handles full delivered -> returned -> refunded cycle without double-restoring stock', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $pm = PaymentMethod::query()->where('code', 'cod')->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Smart Watch',
        'slug' => 'smart-watch',
        'sku' => 'WATCH-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 10,
        'track_inventory' => true,
    ]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'USD',
        'min_quantity' => 1,
    ]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);
    $order = $orders->placeOrder(
        ['customer_name' => 'Nour', 'customer_phone' => '01055555555'],
        [['product_id' => $product->id, 'quantity' => 2]],
        $pm->id
    );

    expect($product->fresh()->stock_quantity)->toBe(8);

    // Move through valid lifecycle: pending -> confirmed -> shipped -> delivered
    $orders->transitionStatus($order, 'confirmed', 'paid');
    $orders->transitionStatus($order, 'shipped');
    $orders->transitionStatus($order, 'delivered');
    expect($order->fresh()->payment_status)->toBe('paid');

    // Customer returns the order -> stock restored to 10 with movement type 'return'
    $orders->returnOrder($order);
    expect($order->fresh()->status)->toBe('returned');
    expect($product->fresh()->stock_quantity)->toBe(10);
    expect(StockMovement::query()->where('product_id', $product->id)->where('type', 'return')->count())->toBe(1);

    // Admin refunds the returned order -> payment becomes refunded, stock stays 10 (no double-restock!)
    $orders->transitionStatus($order->fresh(), 'refunded');
    expect($order->fresh()->status)->toBe('refunded');
    expect($order->fresh()->payment_status)->toBe('refunded');
    expect($product->fresh()->stock_quantity)->toBe(10);
});

it('requires shipping address on checkout and saves address for logged-in customer', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $pm = PaymentMethod::query()->where('code', 'cod')->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Mouse',
        'slug' => 'mouse',
        'sku' => 'MOUSE-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 10,
    ]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '30.0000',
        'currency' => 'USD',
        'min_quantity' => 1,
    ]);

    $customer = \App\Models\Customer::query()->create([
        'name' => 'Tarek',
        'email' => 'tarek@catalogflow.test',
        'phone' => '01033334444',
        'status' => 'active',
        'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
    ]);

    $this->actingAs($customer, 'customer')->post('/cart/add', [
        'product_id' => $product->id,
        'quantity' => 1,
    ])->assertRedirect();

    $this->actingAs($customer, 'customer')->put("/cart/{$product->id}-0", ['quantity' => 2])->assertRedirect();

    // Missing shipping address must fail validation
    $this->actingAs($customer, 'customer')->post('/checkout', [
        'customer_name' => 'Tarek',
        'customer_phone' => '01033334444',
        'payment_method_id' => $pm->id,
    ])->assertSessionHasErrors(['shipping_address', 'shipping_address.city', 'shipping_address.street']);

    // Valid shipping address + save_address succeeds and saves address
    $this->actingAs($customer, 'customer')->post('/checkout', [
        'customer_name' => 'Tarek',
        'customer_phone' => '01033334444',
        'shipping_address' => [
            'city' => 'Giza',
            'area' => 'Dokki',
            'street' => '15 Mesaha Sq',
        ],
        'payment_method_id' => $pm->id,
        'save_address' => true,
    ])->assertRedirect();

    expect($customer->addresses()->count())->toBe(1);
    expect($product->fresh()->stock_quantity)->toBe(8);
});

it('automatically marks COD payment as paid when order transitions to delivered', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Speaker',
        'slug' => 'speaker',
        'sku' => 'SPK-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 5,
    ]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '80.0000',
        'currency' => 'USD',
        'min_quantity' => 1,
    ]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);
    $order = $orders->placeOrder(
        ['customer_name' => 'Hany', 'customer_phone' => '01088887777'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id
    );

    expect($order->payment_status)->toBe('unpaid');
    $orders->transitionStatus($order, 'confirmed');
    $orders->transitionStatus($order, 'shipped');
    $orders->transitionStatus($order, 'delivered');

    expect($order->fresh()->status)->toBe('delivered');
    expect($order->fresh()->payment_status)->toBe('paid');
    expect($order->payments()->first()->status)->toBe('completed');
});
