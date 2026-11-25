<?php

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('completes a full Fawry checkout and callback lifecycle end-to-end', function () {
    Http::fake([
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge' => Http::response([
            'statusCode' => 200,
            'referenceNumber' => '9988776655',
            'fawryRefNumber' => 'FWR-INT-1',
        ]),
    ])->preventStrayRequests();

    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 5]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '250.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 2])->assertRedirect();
    $this->post('/checkout', [
        'customer_name' => 'Integration Buyer',
        'customer_phone' => '01012345678',
        'shipping_address' => ['city' => 'Cairo', 'street' => '1 Nile St'],
        'payment_method_id' => $fawry->id,
    ])->assertRedirect();

    $order = Order::query()->firstOrFail();
    expect($order->status)->toBe('pending');
    expect($order->payment_status)->toBe('unpaid');
    expect($product->fresh()->stock_quantity)->toBe(3);

    $amount = number_format((float) $order->grand_total, 2, '.', '');
    $sig = hash('sha256', "FWR-INT-1{$order->order_number}{$amount}{$amount}PAIDPAYATFAWRY9988776655SEC456");

    $this->postJson('/payments/callback/fawry', [
        'fawryRefNumber' => 'FWR-INT-1',
        'merchantRefNumber' => $order->order_number,
        'paymentAmount' => $amount,
        'orderAmount' => $amount,
        'orderStatus' => 'PAID',
        'paymentMethod' => 'PAYATFAWRY',
        'paymentRefrenceCode' => '9988776655',
        'messageSignature' => $sig,
    ])->assertOk();

    expect($order->fresh()->payment_status)->toBe('paid');
    expect($order->fresh()->status)->toBe('confirmed');
});

it('exports and imports Arabic UTF-8 CSV products cleanly', function () {
    $admin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    $csv = "\xEF\xBB\xBFname,sku,status,visibility,regular_price,stock_quantity\n\"منتج عربي\",AR-SKU-1,published,public,120.50,15\n";
    $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

    $this->actingAs($admin)->post('/admin/import-export/import', [
        'file' => $file,
        'duplicate_strategy' => 'update',
    ])->assertRedirect();

    $imported = Product::query()->where('sku', 'AR-SKU-1')->first();
    expect($imported)->not->toBeNull();
    expect($imported->name)->toBe('منتج عربي');
});
