<?php

use App\Models\ImportJob;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\DemoCatalogSeeder;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class, DemoCatalogSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@Sannafly.test')->firstOrFail();
});

it('exports full product details CSV with formula injection protection', function () {
    Product::query()->create([
        'name' => '=CMD("calc")',
        'slug' => 'evil-formula',
        'sku' => 'EVIL-1',
        'status' => 'published',
        'visibility' => 'public',
        'tags' => ['alpha', 'beta'],
    ]);

    $response = $this->actingAs($this->admin)->get('/admin/import-export/export?format=csv');
    $response->assertOk();
    $content = $response->streamedContent();

    expect($content)->toContain('regular_price');
    expect($content)->toContain('variations');
    expect($content)->toContain("'=CMD");
});

it('previews and imports full product details including multi-pricing and variations', function () {
    $csv = "sku,name,name_ar,category,brand,regular_price,sale_price,stock_quantity,status,tags,variations\n";
    $csv .= "IMP-001,Imported Monitor,شاشة مستوردة,Monitors,Dell,299.00,249.00,15,published,\"4k,hdr\",\"IMP-001-27:27 Inch:299:10; IMP-001-32:32 Inch:349:5\"\n";
    $csv .= ",Missing SKU,بدون رمز,Monitors,Dell,100.00,,5,draft,,\n";

    $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

    // Step 1: Preview
    $preview = $this->actingAs($this->admin)->postJson('/admin/import-export/preview', ['file' => $file]);
    $preview->assertOk()->assertJsonPath('total_rows', 2);

    // Step 2: Import using previewed file_path & suggested_mapping
    $this->actingAs($this->admin)->post('/admin/import-export/import', [
        'file_path' => $preview->json('file_path'),
        'filename' => 'products.csv',
        'format' => 'csv',
        'column_mapping' => $preview->json('suggested_mapping'),
        'duplicate_strategy' => 'update',
    ])->assertRedirect();

    $product = Product::query()->where('sku', 'IMP-001')->firstOrFail();
    expect($product->prices()->whereNull('variation_id')->count())->toBe(2);
    expect($product->prices()->count())->toBe(4);
    expect($product->variations()->count())->toBe(2);
    expect($product->tags)->toBe(['4k', 'hdr']);

    $job = ImportJob::query()->latest()->firstOrFail();
    expect($job->failed_rows)->toBe(1);

    $this->actingAs($this->admin)->get("/admin/import-export/jobs/{$job->id}/errors")->assertOk();
});

it('renders print catalog page for authorized user', function () {
    $this->actingAs($this->admin)->get('/admin/print/catalog')->assertOk();
});
