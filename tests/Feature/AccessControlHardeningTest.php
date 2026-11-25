<?php

use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariation;
use App\Services\OrderService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
