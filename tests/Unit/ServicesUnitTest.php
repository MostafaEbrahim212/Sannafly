<?php

use App\Models\Attribute;
use App\Models\AttributeOption;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockMovement;
use App\Services\ImageService;
use App\Services\InventoryService;
use App\Services\ProductService;
use App\Services\SettingsService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('manages settings cache, types, publicSettings, and byGroup', function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);

    /** @var SettingsService $settings */
    $settings = app(SettingsService::class);
    $settings->set('test_bool', true, 'custom', 'boolean', true);
    $settings->set('test_secret', 'hidden-val', 'custom', 'secret', false);

    expect($settings->isEnabled('test_bool'))->toBeTrue();
    expect($settings->publicSettings())->toHaveKey('test_bool')->not->toHaveKey('test_secret');
    expect($settings->byGroup('custom', false))->not->toHaveKey('test_secret');
    expect($settings->byGroup('custom', true))->toHaveKey('test_secret');
});

it('processes uploaded images to WebP and generates thumbnails without EXIF', function () {
    Storage::fake('public');

    /** @var ImageService $images */
    $images = app(ImageService::class);
    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $stored = $images->processAndStore($file, 'products');
    expect($stored['path'])->toEndWith('.webp');
    expect($stored['thumbnail_path'])->toEndWith('.webp');
    Storage::disk('public')->assertExists($stored['path']);
    Storage::disk('public')->assertExists($stored['thumbnail_path']);

    $images->deleteFiles([$stored['path'], $stored['thumbnail_path']]);
    Storage::disk('public')->assertMissing($stored['path']);
    Storage::disk('public')->assertMissing($stored['thumbnail_path']);
});

it('generates Cartesian variations with unique combination_hash and skips duplicates', function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);

    $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color', 'type' => 'select']);
    $red = AttributeOption::query()->create(['attribute_id' => $color->id, 'value' => 'Red']);
    $blue = AttributeOption::query()->create(['attribute_id' => $color->id, 'value' => 'Blue']);

    $size = Attribute::query()->create(['name' => 'Size', 'slug' => 'size', 'type' => 'select']);
    $s = AttributeOption::query()->create(['attribute_id' => $size->id, 'value' => 'S']);
    $m = AttributeOption::query()->create(['attribute_id' => $size->id, 'value' => 'M']);

    $product = Product::factory()->create(['has_variations' => true, 'stock_quantity' => 0]);

    /** @var ProductService $productService */
    $productService = app(ProductService::class);
    $created1 = $productService->generateVariations($product, [
        [$red->id, $blue->id],
        [$s->id, $m->id],
    ]);

    expect($created1)->toBe(4);
    expect(ProductVariation::hashOptions([$red->id, $s->id]))
        ->toBe(ProductVariation::hashOptions([$s->id, $red->id]));

    // Second run with same option groups must produce 0 duplicates
    $created2 = $productService->generateVariations($product, [
        [$red->id, $blue->id],
        [$s->id, $m->id],
    ]);
    expect($created2)->toBe(0);
});

it('maintains quantity_before/after invariant and syncs variation aggregate stock', function () {
    $product = Product::factory()->create(['has_variations' => true, 'stock_quantity' => 0]);
    $v1 = ProductVariation::factory()->create(['product_id' => $product->id, 'stock_quantity' => 5, 'status' => 'active']);
    $v2 = ProductVariation::factory()->create(['product_id' => $product->id, 'stock_quantity' => 3, 'status' => 'active']);

    /** @var InventoryService $inv */
    $inv = app(InventoryService::class);
    $inv->adjustStock($product, 4, 'adjustment', $v1, 'Add 4');
    $inv->adjustStock($product, -2, 'sale', $v2, 'Sell 2');

    expect($v1->fresh()->stock_quantity)->toBe(9);
    expect($v2->fresh()->stock_quantity)->toBe(1);
    expect($product->fresh()->stock_quantity)->toBe(10);

    $movements = StockMovement::query()->where('product_id', $product->id)->get();
    foreach ($movements as $m) {
        expect($m->quantity_before + $m->quantity_change)->toBe($m->quantity_after);
    }
});
