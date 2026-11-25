<?php

use App\Models\Attribute;
use App\Models\AttributeOption;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@Sannafly.test')->firstOrFail();
});

it('creates a product with multiple prices inside a transaction', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $wholesale = PriceType::query()->where('slug', 'wholesale')->firstOrFail();

    $response = $this->actingAs($this->admin)->post('/admin/products', [
        'name' => 'Pro Camera Tripod',
        'name_ar' => 'حامل كاميرا احترافي',
        'sku' => 'CAM-TRP-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 30,
        'prices' => [
            ['price_type_id' => $regular->id, 'amount' => '129.99', 'min_quantity' => 1],
            ['price_type_id' => $wholesale->id, 'amount' => '95.50', 'min_quantity' => 10],
        ],
    ]);

    $response->assertRedirect();
    $product = Product::query()->where('sku', 'CAM-TRP-01')->first();
    expect($product)->not->toBeNull();
    expect($product->prices()->count())->toBe(2);
});

it('generates variation combinations without duplicates', function () {
    $product = Product::query()->create([
        'name' => 'T-Shirt',
        'slug' => 't-shirt',
        'sku' => 'TSHIRT-1',
        'status' => 'published',
        'visibility' => 'public',
    ]);

    $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color', 'type' => 'color']);
    $red = AttributeOption::query()->create(['attribute_id' => $color->id, 'value' => 'Red']);
    $blue = AttributeOption::query()->create(['attribute_id' => $color->id, 'value' => 'Blue']);

    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size', 'type' => 'select']);
    $sm = AttributeOption::query()->create(['attribute_id' => $size->id, 'value' => 'S']);
    $lg = AttributeOption::query()->create(['attribute_id' => $size->id, 'value' => 'L']);

    /** @var ProductService $service */
    $service = app(ProductService::class);
    $created = $service->generateVariations($product, [[$red->id, $blue->id], [$sm->id, $lg->id]]);
    expect($created)->toBe(4);

    // Calling again should create 0 duplicates
    $secondRun = $service->generateVariations($product, [[$red->id, $blue->id], [$sm->id, $lg->id]]);
    expect($secondRun)->toBe(0);
    expect($product->variations()->count())->toBe(4);
});

it('creates a product with inline variations and uploaded images in one wizard submission', function () {
    Storage::fake('public');

    $response = $this->actingAs($this->admin)->post('/admin/products', [
        'name' => 'Wizard Hoodie',
        'sku' => 'WIZ-HOOD-1',
        'status' => 'published',
        'visibility' => 'public',
        'has_variations' => true,
        'variations' => [
            ['name' => 'Black / M', 'sku' => 'WIZ-HOOD-1-BLK-M', 'price' => '59.00', 'stock_quantity' => 12, 'is_default' => true],
            ['name' => 'White / L', 'sku' => 'WIZ-HOOD-1-WHT-L', 'price' => '62.00', 'stock_quantity' => 8, 'is_default' => false],
        ],
        'images' => [
            UploadedFile::fake()->image('hoodie.jpg', 800, 800),
        ],
    ]);

    $response->assertRedirect();
    $product = Product::query()->where('sku', 'WIZ-HOOD-1')->firstOrFail();
    expect($product->variations()->count())->toBe(2);
    expect($product->stock_quantity)->toBe(20);
    expect($product->images()->count())->toBe(1);
});

it('stores per-variation images and falls back to base images when a variant has none', function () {
    Storage::fake('public');

    $response = $this->actingAs($this->admin)->post('/admin/products', [
        'name' => 'Studio Lamp',
        'sku' => 'LAMP-VAR-1',
        'status' => 'published',
        'visibility' => 'public',
        'has_variations' => true,
        'variations' => [
            ['name' => 'Matte Black', 'sku' => 'LAMP-VAR-1-BLK', 'price' => '79.00', 'stock_quantity' => 5, 'is_default' => true],
            ['name' => 'Silver', 'sku' => 'LAMP-VAR-1-SLV', 'price' => '85.00', 'stock_quantity' => 7, 'is_default' => false],
        ],
        'images' => [
            UploadedFile::fake()->image('base-lamp.jpg', 800, 800),
        ],
        'variation_images' => [
            0 => UploadedFile::fake()->image('black-lamp.jpg', 800, 800),
        ],
    ]);

    $response->assertRedirect();
    $product = Product::query()->where('sku', 'LAMP-VAR-1')->with(['variations.images'])->firstOrFail();

    $blackVar = $product->variations->firstWhere('sku', 'LAMP-VAR-1-BLK');
    $silverVar = $product->variations->firstWhere('sku', 'LAMP-VAR-1-SLV');

    expect($product->images()->whereNull('variation_id')->count())->toBe(1);
    expect($blackVar->images()->count())->toBe(1);
    expect($silverVar->images()->count())->toBe(0);

    $this->get("/products/{$product->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Storefront/ProductDetail')
            ->has('product.images', 1)
            ->where('product.variations.0.images.0.variation_id', $blackVar->id)
            ->has('product.variations.1.images', 0)
        );
});
