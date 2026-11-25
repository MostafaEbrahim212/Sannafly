<?php

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariation;
use App\Services\OrderService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

function createTestProduct(array $overrides = []): Product
{
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();

    $product = Product::query()->create(array_merge([
        'name' => 'Purchasable Item',
        'slug' => 'purchasable-'.uniqid(),
        'sku' => 'SKU-'.uniqid(),
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 5,
        'track_inventory' => true,
        'allow_backorder' => false,
        'allow_negative_stock' => false,
    ], $overrides));

    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    return $product;
}

it('blocks adding draft, archived, or private products to cart', function (string $status, string $visibility) {
    $product = createTestProduct(['status' => $status, 'visibility' => $visibility]);

    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 1])
        ->assertSessionHas('error');

    expect(session('cart', []))->toBeEmpty();
})->with([
    'draft' => ['draft', 'public'],
    'archived' => ['archived', 'public'],
    'private' => ['published', 'private'],
]);

it('blocks adding an inactive variation to cart', function () {
    $product = createTestProduct(['has_variations' => true]);
    $variation = ProductVariation::query()->create([
        'product_id' => $product->id,
        'sku' => 'VAR-INACTIVE',
        'combination_hash' => hash('sha256', '1'),
        'name' => 'Red / M',
        'stock_quantity' => 5,
        'status' => 'inactive',
    ]);

    $this->post('/cart/add', [
        'product_id' => $product->id,
        'variation_id' => $variation->id,
        'quantity' => 1,
    ])->assertSessionHas('error');

    expect(session('cart', []))->toBeEmpty();
});

it('blocks adding or updating cart quantity beyond available stock when backorder is disabled', function () {
    $product = createTestProduct(['stock_quantity' => 3]);

    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 5])
        ->assertSessionHas('error');
    expect(session('cart', []))->toBeEmpty();

    // Add 2 (valid), then try to update to 5 (invalid)
    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 2])
        ->assertSessionHas('success');

    $key = $product->id.'-0';
    $this->put("/cart/{$key}", ['quantity' => 5])
        ->assertSessionHas('error');
    expect(session("cart.{$key}.quantity"))->toBe(2);
});

it('blocks placing an order if a product was unpublished or deleted after being added to cart', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $p1 = createTestProduct(['stock_quantity' => 10]);
    $p2 = createTestProduct(['stock_quantity' => 10]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);

    $p1->update(['status' => 'draft']);
    expect(fn () => $orders->placeOrder(
        ['customer_name' => 'Ali', 'customer_phone' => '01012345678'],
        [['product_id' => $p1->id, 'quantity' => 1]],
        $cod->id
    ))->toThrow(RuntimeException::class);

    $p2->delete();
    expect(fn () => $orders->placeOrder(
        ['customer_name' => 'Ali', 'customer_phone' => '01012345678'],
        [['product_id' => $p2->id, 'quantity' => 1]],
        $cod->id
    ))->toThrow(ModelNotFoundException::class);
});

it('denies unauthorized access to order confirmation and strips sensitive fields from response', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $customerA = Customer::query()->create([
        'name' => 'Customer A',
        'email' => 'a@example.com',
        'phone' => '01011111111',
        'password' => 'secret123',
        'status' => 'active',
    ]);
    $customerB = Customer::query()->create([
        'name' => 'Customer B',
        'email' => 'b@example.com',
        'phone' => '01022222222',
        'password' => 'secret123',
        'status' => 'active',
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-20261125-XYZ1234567',
        'customer_id' => $customerA->id,
        'customer_name' => 'Customer A',
        'customer_phone' => '01011111111',
        'payment_method_id' => $cod->id,
        'subtotal' => '100.0000',
        'grand_total' => '100.0000',
        'currency' => 'EGP',
        'idempotency_key' => 'secret-idem-hash',
    ]);
    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $cod->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'status' => 'pending',
        'payload' => ['gateway_secret_token' => 'LEAKED_PAYLOAD_SECRET'],
    ]);

    // Unrelated guest gets 404
    $this->get("/orders/confirmation/{$order->order_number}")->assertNotFound();

    // Another customer gets 404
    $this->actingAs($customerB, 'customer')
        ->get("/orders/confirmation/{$order->order_number}")
        ->assertNotFound();

    // Owner customer succeeds and response leaks no payload, config, or idempotency_key
    $res = $this->actingAs($customerA, 'customer')
        ->get("/orders/confirmation/{$order->order_number}")
        ->assertOk();

    expect($res->getContent())->not->toContain('LEAKED_PAYLOAD_SECRET');
    expect($res->getContent())->not->toContain('secret-idem-hash');

    // Signed URL works for guest and expires
    Auth::guard('customer')->logout();
    $signedUrl = URL::temporarySignedRoute('orders.confirmation', now()->addMinutes(10), ['orderNumber' => $order->order_number]);
    $this->get($signedUrl)->assertOk();

    $expiredUrl = URL::temporarySignedRoute('orders.confirmation', now()->subMinute(), ['orderNumber' => $order->order_number]);
    $this->get($expiredUrl)->assertNotFound();
});

it('normalizes Egyptian phone numbers on track-order and throttles abuse', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $order = Order::query()->create([
        'order_number' => 'ORD-20261125-TRACK12345',
        'customer_name' => 'Ali',
        'customer_phone' => '01012345678',
        'payment_method_id' => $cod->id,
        'subtotal' => '100.0000',
        'grand_total' => '100.0000',
        'currency' => 'EGP',
    ]);

    $res = $this->get('/track-order?order_number=ORD-20261125-TRACK12345&phone='.urlencode('+20 101 234 5678'));
    $res->assertOk();
    expect($res->getContent())->toContain('ORD-20261125-TRACK12345');
    expect($res->getContent())->not->toContain('"notFound":true');

    // Throttle triggers after repeated requests
    $hit429 = false;
    for ($i = 0; $i < 25; $i++) {
        $r = $this->get('/track-order?order_number=ORD-20261125-TRACK12345&phone=01000000000');
        if ($r->getStatusCode() === 429) {
            $hit429 = true;
            break;
        }
    }
    expect($hit429)->toBeTrue();
});

it('throttles coupon apply, cart add, and review submission endpoints', function () {
    $product = createTestProduct(['stock_quantity' => 50]);

    $couponHit429 = false;
    for ($i = 0; $i < 15; $i++) {
        if ($this->post('/cart/coupon', ['code' => 'NOPE'])->getStatusCode() === 429) {
            $couponHit429 = true;
            break;
        }
    }
    expect($couponHit429)->toBeTrue();

    $cartHit429 = false;
    for ($i = 0; $i < 35; $i++) {
        if ($this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 1])->getStatusCode() === 429) {
            $cartHit429 = true;
            break;
        }
    }
    expect($cartHit429)->toBeTrue();

    $customer = Customer::query()->create([
        'name' => 'Reviewer',
        'email' => 'rev@example.com',
        'phone' => '01012345678',
        'password' => 'secret123',
        'status' => 'active',
    ]);
    $reviewHit429 = false;
    for ($i = 0; $i < 15; $i++) {
        if ($this->actingAs($customer, 'customer')->post("/products/{$product->id}/reviews", ['rating' => 5, 'comment' => 'Nice'])->getStatusCode() === 429) {
            $reviewHit429 = true;
            break;
        }
    }
    expect($reviewHit429)->toBeTrue();
});

it('enforces per-customer coupon usage_limit_per_customer and releases redemption on cancel', function () {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $product = createTestProduct(['stock_quantity' => 20]);

    $coupon = Coupon::query()->create([
        'code' => 'ONCEPERUSER',
        'name' => 'Once Per User',
        'type' => 'fixed',
        'value' => '10.0000',
        'usage_limit' => 10,
        'usage_limit_per_customer' => 1,
        'used_count' => 0,
        'is_active' => true,
    ]);

    $customerA = Customer::query()->create([
        'name' => 'Customer A',
        'email' => 'ca@example.com',
        'phone' => '01011111111',
        'password' => 'secret123',
        'status' => 'active',
    ]);
    $customerB = Customer::query()->create([
        'name' => 'Customer B',
        'email' => 'cb@example.com',
        'phone' => '01022222222',
        'password' => 'secret123',
        'status' => 'active',
    ]);

    /** @var OrderService $orders */
    $orders = app(OrderService::class);

    $this->actingAs($customerA, 'customer');
    $orderA1 = $orders->placeOrder(
        ['customer_name' => 'Customer A', 'customer_phone' => '01011111111'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'ONCEPERUSER'
    );

    // Second order by Customer A with same coupon must fail
    expect(fn () => $orders->placeOrder(
        ['customer_name' => 'Customer A', 'customer_phone' => '01011111111'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'ONCEPERUSER'
    ))->toThrow(RuntimeException::class);

    // Customer B can still use it
    $this->actingAs($customerB, 'customer');
    $orderB1 = $orders->placeOrder(
        ['customer_name' => 'Customer B', 'customer_phone' => '01022222222'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'ONCEPERUSER'
    );
    expect($orderB1->coupon_code)->toBe('ONCEPERUSER');

    // Cancelling Customer A's order releases the redemption so Customer A can use it again
    $orders->cancelOrder($orderA1);
    $this->actingAs($customerA, 'customer');
    $orderA2 = $orders->placeOrder(
        ['customer_name' => 'Customer A', 'customer_phone' => '01011111111'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id,
        null,
        'ONCEPERUSER'
    );
    expect($orderA2->coupon_code)->toBe('ONCEPERUSER');
});
