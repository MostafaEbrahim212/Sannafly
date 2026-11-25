<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeOption;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariation;
use App\Models\ShippingZone;
use Illuminate\Database\Seeder;

class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::query()->updateOrCreate(
            ['slug' => 'electronics'],
            ['name' => 'Electronics', 'name_ar' => 'إلكترونيات', 'sort_order' => 1, 'is_visible' => true]
        );
        $audio = Category::query()->updateOrCreate(
            ['slug' => 'audio-devices'],
            ['parent_id' => $electronics->id, 'name' => 'Audio Devices', 'name_ar' => 'أجهزة صوتية', 'sort_order' => 2, 'is_visible' => true]
        );
        $office = Category::query()->updateOrCreate(
            ['slug' => 'workspace-gear'],
            ['name' => 'Workspace Gear', 'name_ar' => 'معدات المكتب', 'sort_order' => 3, 'is_visible' => true]
        );

        $apex = Brand::query()->updateOrCreate(
            ['slug' => 'apex-tech'],
            ['name' => 'ApexTech', 'name_ar' => 'أبيكس تك', 'is_visible' => true, 'sort_order' => 1]
        );
        $nordic = Brand::query()->updateOrCreate(
            ['slug' => 'nordic-craft'],
            ['name' => 'NordicCraft', 'name_ar' => 'نورديك كرافت', 'is_visible' => true, 'sort_order' => 2]
        );

        $colorAttr = Attribute::query()->updateOrCreate(
            ['slug' => 'color'],
            ['name' => 'Color', 'name_ar' => 'اللون', 'type' => 'color', 'sort_order' => 1]
        );
        $sizeAttr = Attribute::query()->updateOrCreate(
            ['slug' => 'size'],
            ['name' => 'Size', 'name_ar' => 'المقاس', 'type' => 'select', 'sort_order' => 2]
        );

        $black = AttributeOption::query()->updateOrCreate(
            ['attribute_id' => $colorAttr->id, 'value' => 'Matte Black'],
            ['value_ar' => 'أسود مطفي', 'color_hex' => '#18181b', 'sort_order' => 1]
        );
        $silver = AttributeOption::query()->updateOrCreate(
            ['attribute_id' => $colorAttr->id, 'value' => 'Silver'],
            ['value_ar' => 'فضي', 'color_hex' => '#cbd5e1', 'sort_order' => 2]
        );
        $stdSize = AttributeOption::query()->updateOrCreate(
            ['attribute_id' => $sizeAttr->id, 'value' => 'Standard'],
            ['value_ar' => 'قياسي', 'sort_order' => 1]
        );
        $proSize = AttributeOption::query()->updateOrCreate(
            ['attribute_id' => $sizeAttr->id, 'value' => 'Pro'],
            ['value_ar' => 'برو', 'sort_order' => 2]
        );

        $regularPriceType = PriceType::query()->where('slug', 'regular')->firstOrFail();
        $wholesalePriceType = PriceType::query()->where('slug', 'wholesale')->firstOrFail();

        $samples = [
            [
                'sku' => 'CF-AUD-101',
                'slug' => 'studio-wireless-headphones',
                'name' => 'Studio Wireless Headphones',
                'name_ar' => 'سماعات استوديو لاسلكية',
                'category_id' => $audio->id,
                'brand_id' => $apex->id,
                'is_featured' => true,
                'has_variations' => true,
                'stock_quantity' => 45,
                'price' => '249.0000',
                'wholesale' => '195.0000',
                'short_description' => 'Active noise cancelling wireless headphones with 40-hour battery.',
                'short_description_ar' => 'سماعات لاسلكية بعزل ضوضاء نشط وبطارية تدوم 40 ساعة.',
            ],
            [
                'sku' => 'CF-WRK-202',
                'slug' => 'ergonomic-aluminum-stand',
                'name' => 'Ergonomic Aluminum Laptop Stand',
                'name_ar' => 'حامل لابتوب ألمنيوم مريح',
                'category_id' => $office->id,
                'brand_id' => $nordic->id,
                'is_featured' => true,
                'has_variations' => false,
                'stock_quantity' => 80,
                'price' => '69.0000',
                'wholesale' => '48.0000',
                'short_description' => 'CNC-machined aluminum stand with adjustable height and cooling vents.',
                'short_description_ar' => 'حامل ألمنيوم بتصميم دقيق وارتفاع قابل للتعديل.',
            ],
            [
                'sku' => 'CF-ELC-303',
                'slug' => 'mechanical-tactile-keyboard',
                'name' => 'Mechanical Tactile Keyboard',
                'name_ar' => 'لوحة مفاتيح ميكانيكية احترافية',
                'category_id' => $electronics->id,
                'brand_id' => $apex->id,
                'is_featured' => true,
                'has_variations' => false,
                'stock_quantity' => 3,
                'price' => '139.0000',
                'wholesale' => '105.0000',
                'short_description' => 'Hot-swappable wireless mechanical keyboard with dual-layout keycaps.',
                'short_description_ar' => 'لوحة مفاتيح ميكانيكية لاسلكية قابلة للتبديل السريع.',
            ],
            [
                'sku' => 'CF-WRK-404',
                'slug' => 'smart-desk-lamp-pro',
                'name' => 'Smart LED Desk Lamp Pro',
                'name_ar' => 'مصباح مكتب ذكي LED برو',
                'category_id' => $office->id,
                'brand_id' => $nordic->id,
                'is_featured' => true,
                'has_variations' => true,
                'stock_quantity' => 35,
                'price' => '89.0000',
                'wholesale' => '68.0000',
                'short_description' => 'Stepless dimming desk lamp with wireless Qi charging base.',
                'short_description_ar' => 'مصباح مكتب ذكي بإضاءة متدرجة وشاحن لاسلكي مدمج.',
            ],
            [
                'sku' => 'CF-AUD-505',
                'slug' => 'usb-c-studio-microphone',
                'name' => 'USB-C Studio Condenser Mic',
                'name_ar' => 'ميكروفون استوديو USB-C احترافي',
                'category_id' => $audio->id,
                'brand_id' => $apex->id,
                'is_featured' => false,
                'has_variations' => false,
                'stock_quantity' => 28,
                'price' => '119.0000',
                'wholesale' => '90.0000',
                'short_description' => 'Cardioid condenser microphone for podcasts, calls, and streaming.',
                'short_description_ar' => 'ميكروفون احترافي نقي الصوت للبودكاست والاجتماعات.',
            ],
            [
                'sku' => 'CF-ELC-606',
                'slug' => 'gan-fast-charger-100w',
                'name' => 'GaN 100W 4-Port Fast Charger',
                'name_ar' => 'شاحن سريع GaN بقدرة 100 واط',
                'category_id' => $electronics->id,
                'brand_id' => $apex->id,
                'is_featured' => false,
                'has_variations' => false,
                'stock_quantity' => 60,
                'price' => '54.0000',
                'wholesale' => '39.0000',
                'short_description' => 'Compact GaN charger with 3 USB-C PD ports and 1 USB-A port.',
                'short_description_ar' => 'شاحن مدمج بـ 4 منافذ للشحن السريع للابتوب والهاتف.',
            ],
        ];

        foreach ($samples as $item) {
            $product = Product::query()->updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $item['category_id'],
                    'brand_id' => $item['brand_id'],
                    'name' => $item['name'],
                    'name_ar' => $item['name_ar'],
                    'slug' => $item['slug'],
                    'short_description' => $item['short_description'],
                    'short_description_ar' => $item['short_description_ar'],
                    'description' => $item['short_description'],
                    'description_ar' => $item['short_description_ar'],
                    'status' => 'published',
                    'visibility' => 'public',
                    'is_featured' => $item['is_featured'],
                    'has_variations' => $item['has_variations'],
                    'stock_quantity' => $item['stock_quantity'],
                    'published_at' => now(),
                ]
            );

            ProductPrice::query()->updateOrCreate(
                ['product_id' => $product->id, 'variation_id' => null, 'price_type_id' => $regularPriceType->id, 'min_quantity' => 1],
                ['amount' => $item['price'], 'currency' => 'USD']
            );
            ProductPrice::query()->updateOrCreate(
                ['product_id' => $product->id, 'variation_id' => null, 'price_type_id' => $wholesalePriceType->id, 'min_quantity' => 10],
                ['amount' => $item['wholesale'], 'currency' => 'USD']
            );

            if ($item['has_variations']) {
                $combos = [
                    ['sku' => $item['sku'].'-BLK-STD', 'name' => 'Matte Black / Standard', 'opts' => [$black->id, $stdSize->id], 'stock' => 25, 'default' => true],
                    ['sku' => $item['sku'].'-SLV-PRO', 'name' => 'Silver / Pro', 'opts' => [$silver->id, $proSize->id], 'stock' => 20, 'default' => false],
                ];
                foreach ($combos as $c) {
                    $var = ProductVariation::query()->updateOrCreate(
                        ['product_id' => $product->id, 'combination_hash' => ProductVariation::hashOptions($c['opts'])],
                        ['sku' => $c['sku'], 'name' => $c['name'], 'stock_quantity' => $c['stock'], 'status' => 'active', 'is_default' => $c['default']]
                    );
                    $var->options()->sync($c['opts']);
                }
            }
        }

        // Seed Promo Coupons
        Coupon::query()->updateOrCreate(
            ['code' => 'WELCOME10'],
            ['name' => 'Welcome 10% Off', 'type' => 'percent', 'value' => 10, 'min_order_amount' => 30, 'is_active' => true]
        );
        Coupon::query()->updateOrCreate(
            ['code' => 'SAVE25'],
            ['name' => '$25 Off Big Orders', 'type' => 'fixed', 'value' => 25, 'min_order_amount' => 150, 'is_active' => true]
        );

        // Seed Shipping Zones
        ShippingZone::query()->updateOrCreate(
            ['name' => 'Cairo & Giza'],
            [
                'name_ar' => 'القاهرة والجيزة',
                'cities' => ['Cairo', 'Giza', 'القاهرة', 'الجيزة', '6th of October', 'New Cairo'],
                'rate' => 10,
                'free_shipping_threshold' => 200,
                'estimated_days' => '1-2 days',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );
        ShippingZone::query()->updateOrCreate(
            ['name' => 'Alexandria & Delta'],
            [
                'name_ar' => 'الإسكندرية والدلتا',
                'cities' => ['Alexandria', 'Mansoura', 'Tanta', 'الإسكندرية', 'المنصورة', 'طنطا'],
                'rate' => 15,
                'free_shipping_threshold' => 250,
                'estimated_days' => '2-3 days',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 2,
            ]
        );
        ShippingZone::query()->updateOrCreate(
            ['name' => 'All Other Governorates'],
            [
                'name_ar' => 'باقي المحافظات',
                'cities' => [],
                'rate' => 20,
                'free_shipping_threshold' => 300,
                'estimated_days' => '3-5 days',
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 99,
            ]
        );
    }
}
