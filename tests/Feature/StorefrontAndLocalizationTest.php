<?php

use App\Models\Product;
use App\Models\ProductInquiry;
use App\Services\SettingsService;
use Database\Seeders\DemoCatalogSeeder;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class, DemoCatalogSeeder::class]);
});

it('renders storefront home, catalog search, product details, and sitemap', function () {
    $this->get('/')->assertOk();
    $this->get('/catalog?search=Headphones')->assertOk();
    $this->get('/catalog?brands=apex-tech&in_stock=1&on_sale=1&min_price=10&max_price=500')->assertOk();
    $this->get('/products/studio-wireless-headphones')->assertOk();
    $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml');
});

it('switches locale between EN (LTR) and AR (RTL)', function () {
    $this->get('/locale/ar')->assertRedirect();
    $this->withSession(['locale' => 'ar'])->get('/')->assertSee('dir="rtl"', false);
    $this->withSession(['locale' => 'en'])->get('/')->assertSee('dir="ltr"', false);
});

it('submits a product inquiry safely', function () {
    $product = Product::query()->firstOrFail();

    $this->post('/inquiries', [
        'product_id' => $product->id,
        'name' => 'Sara Ali',
        'phone' => '+201111111111',
        'message' => 'Is wholesale pricing available for 50 units?',
    ])->assertRedirect();

    expect(ProductInquiry::query()->where('name', 'Sara Ali')->exists())->toBeTrue();
});

it('disables cart route cleanly when e-commerce module is turned off', function () {
    /** @var SettingsService $settings */
    $settings = app(SettingsService::class);
    $settings->set('module_ecommerce', false, 'modules', 'boolean', true);

    $this->get('/cart')->assertNotFound();
    $this->get('/catalog')->assertOk();
});

it('tracks order only when both order number and matching phone are provided', function () {
    $order = \App\Models\Order::query()->create([
        'order_number' => 'ORD-TRACK-99',
        'customer_name' => 'Khaled',
        'customer_phone' => '01022223333',
        'subtotal' => '50.0000',
        'grand_total' => '50.0000',
        'currency' => 'USD',
    ]);

    $this->get('/track-order')->assertOk();
    $this->get('/track-order?order_number=ORD-TRACK-99&phone=01099999999')
        ->assertOk()
        ->assertDontSee('Khaled');

    $this->get('/track-order?order_number=ORD-TRACK-99&phone=01022223333')
        ->assertOk()
        ->assertSee('ORD-TRACK-99');
});
