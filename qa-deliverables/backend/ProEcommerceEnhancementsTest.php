<?php

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ShippingZone;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SettingsService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('supports wallet_transfer checkout with WebP receipt upload', function () {
    Storage::fake('public');

    $walletPm = PaymentMethod::query()->where('driver', 'wallet_transfer')->firstOrFail();
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 5]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '200.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 1])->assertRedirect();

    $receipt = UploadedFile::fake()->image('receipt.png', 400, 600);
    $this->post('/checkout', [
        'customer_name' => 'InstaPay Buyer',
        'customer_phone' => '01012345678',
        'shipping_address' => ['city' => 'Cairo', 'street' => '10 Nile St'],
        'payment_method_id' => $walletPm->id,
        'payment_receipt' => $receipt,
    ])->assertRedirect();

    $order = Order::query()->firstOrFail();
    expect($order->receipt_path)->not->toBeNull();
    expect($order->receipt_path)->toEndWith('.webp');
    Storage::disk('public')->assertExists($order->receipt_path);
});

it('applies free_shipping coupons and enforces first_order_only coupons', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 10]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    ShippingZone::factory()->create([
        'cities' => ['Cairo'],
        'rate' => '60.0000',
        'free_shipping_threshold' => '1000.0000',
        'is_default' => true,
    ]);

    Coupon::factory()->create([
        'code' => 'FREESHIP1',
        'type' => 'free_shipping',
        'value' => '0.0000',
        'first_order_only' => true,
        'is_active' => true,
    ]);

    $customer = Customer::factory()->create();
    $this->actingAs($customer, 'customer');

    /** @var OrderService $orders */
    $orders = app(OrderService::class);
    $first = $orders->placeOrder(
        ['customer_name' => $customer->name, 'customer_phone' => $customer->phone, 'shipping_address' => ['city' => 'Cairo']],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'FREESHIP1'
    );

    expect((string) $first->shipping_total)->toBe('0.0000');
    expect((string) $first->grand_total)->toBe('100.0000');

    expect(fn () => $orders->placeOrder(
        ['customer_name' => $customer->name, 'customer_phone' => $customer->phone, 'shipping_address' => ['city' => 'Cairo']],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'FREESHIP1'
    ))->toThrow(RuntimeException::class);
});

it('calculates weight-based shipping surcharges accurately', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 10, 'weight' => '2.500']);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    ShippingZone::factory()->create([
        'cities' => ['Cairo'],
        'rate' => '50.0000',
        'free_shipping_threshold' => '1000.0000',
        'base_weight_kg' => '2.000',
        'per_kg_rate' => '10.0000',
        'is_default' => true,
    ]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);
    // 2 items * 2.5kg = 5.0kg -> 3.0kg extra * 10 = 30 + 50 base = 80 shipping
    $order = $orders->placeOrder(
        ['customer_name' => 'Weight Buyer', 'customer_phone' => '01012345678', 'shipping_address' => ['city' => 'Cairo']],
        [['product_id' => $product->id, 'quantity' => 2]],
        $cod->id
    );

    expect((string) $order->total_weight)->toBe('5.000');
    expect((string) $order->shipping_total)->toBe('80.0000');
    expect((string) $order->grand_total)->toBe('280.0000');
});

it('enforces verified-purchase reviews when reviews_verified_only is enabled', function () {
    app(SettingsService::class)->set('reviews_verified_only', true, 'products', 'boolean', true);

    $customer = Customer::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($customer, 'customer')
        ->post("/products/{$product->id}/reviews", ['rating' => 5, 'comment' => 'Fake review'])
        ->assertSessionHas('error');
});

it('renders admin shipping label, sales analytics, and analytics CSV export', function () {
    $admin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    $order = Order::factory()->create(['order_number' => '=FORMULA_TEST', 'tracking_number' => 'AWB-999']);

    $this->actingAs($admin)->get("/admin/orders/{$order->id}/label")->assertOk();
    $this->actingAs($admin)->get('/admin/analytics')->assertOk();

    $csv = $this->actingAs($admin)->get('/admin/analytics/export?days=30');
    $csv->assertOk();
    expect($csv->streamedContent())->toContain("'=FORMULA_TEST");
});
