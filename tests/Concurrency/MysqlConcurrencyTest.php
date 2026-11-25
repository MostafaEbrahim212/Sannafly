<?php

use App\Models\Coupon;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Services\OrderService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

it('prevents overselling and coupon over-redemption under concurrent MySQL transactions', function () {
    if (DB::getDriverName() !== 'mysql') {
        $this->markTestSkipped('MySQL 8 required for row-level lockForUpdate concurrency tests.');
    }

    $this->artisan('migrate:fresh', ['--force' => true]);
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);

    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 3, 'track_inventory' => true, 'allow_backorder' => false]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);
    Coupon::factory()->create(['code' => 'RACE1', 'usage_limit' => 2, 'used_count' => 0]);

    $script = sprintf(
        'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); try { app(%s::class)->placeOrder(["customer_name"=>"Worker","customer_phone"=>"01012345678"], [["product_id"=>%d,"quantity"=>1]], %d, null, "RACE1"); echo "OK"; } catch (Throwable $e) { echo "FAIL"; }',
        OrderService::class,
        $product->id,
        $cod->id
    );

    $processes = [];
    for ($i = 0; $i < 6; $i++) {
        $p = new Process(['php', '-r', $script], base_path());
        $p->start();
        $processes[] = $p;
    }

    $okCount = 0;
    foreach ($processes as $p) {
        $p->wait();
        if (str_contains($p->getOutput(), 'OK')) {
            $okCount++;
        }
    }

    expect($okCount)->toBeLessThanOrEqual(2);
    expect($product->fresh()->stock_quantity)->toBeGreaterThanOrEqual(0);
})->group('mysql');
