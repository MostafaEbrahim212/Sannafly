<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Services\SettingsService;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        /** @var SettingsService $settings */
        $settings = app(SettingsService::class);

        $defaults = [
            // General & Appearance (public)
            ['general', 'site_name', 'Sannafly', 'string', true],
            ['general', 'site_name_ar', 'صنّفلي', 'string', true],
            ['general', 'site_description', 'Categorize. Display. Sell. — Product Catalog & Storefront Platform', 'string', true],
            ['general', 'site_description_ar', 'صنّف. اعرض. بِع. — منصة احترافية لإدارة وعرض وبيع المنتجات', 'string', true],
            ['general', 'contact_email', 'hello@sannafly.com', 'string', true],
            ['general', 'contact_phone', '+201000000000', 'string', true],
            ['general', 'whatsapp_number', '201000000000', 'string', true],
            ['general', 'currency', 'EGP', 'string', true],
            ['general', 'currency_symbol', 'ج.م', 'string', true],

            // Appearance / Customization (public)
            ['appearance', 'primary_color', '#0A5C57', 'string', true],
            ['appearance', 'accent_color', '#F6A21E', 'string', true],
            ['appearance', 'text_color', '#15211F', 'string', true],
            ['appearance', 'theme_surface', 'warm', 'string', true],
            ['appearance', 'border_radius', 'rounded', 'string', true],
            ['appearance', 'hero_title', 'Categorize. Display. Sell.', 'string', true],
            ['appearance', 'hero_title_ar', 'صنّف. اعرض. بِع.', 'string', true],
            ['appearance', 'hero_subtitle', 'Categorize your products. Display them beautifully. Sell faster.', 'string', true],
            ['appearance', 'hero_subtitle_ar', 'نظّم منتجاتك في أقسام واضحة، واعرضها لعملائك بشكل احترافي، وبِع أسرع.', 'string', true],
            ['appearance', 'show_hero', true, 'boolean', true],
            ['appearance', 'show_featured', true, 'boolean', true],
            ['appearance', 'show_categories', true, 'boolean', true],
            ['appearance', 'show_brands', true, 'boolean', true],
            ['appearance', 'product_grid_columns', 4, 'integer', true],
            ['appearance', 'image_ratio', 'square', 'string', true],

            // Localization
            ['localization', 'default_locale', 'en', 'string', true],
            ['localization', 'enable_arabic', true, 'boolean', true],

            // Feature / Module Toggles (public)
            ['modules', 'module_ecommerce', true, 'boolean', true],
            ['modules', 'module_cart', true, 'boolean', true],
            ['modules', 'module_checkout', true, 'boolean', true],
            ['modules', 'module_guest_checkout', true, 'boolean', true],
            ['modules', 'module_stock', true, 'boolean', true],
            ['modules', 'module_brands', true, 'boolean', true],
            ['modules', 'module_variations', true, 'boolean', true],
            ['modules', 'module_custom_pricing', true, 'boolean', true],
            ['modules', 'module_whatsapp', true, 'boolean', true],
            ['modules', 'module_inquiries', true, 'boolean', true],

            // Products & Inventory
            ['products', 'default_low_stock_threshold', 5, 'integer', false],
            ['products', 'image_max_width', 1600, 'integer', false],
            ['products', 'image_thumb_width', 400, 'integer', false],
            ['products', 'image_quality', 85, 'integer', false],

            // SEO
            ['seo', 'meta_title', 'Sannafly — صنّفلي | Categorize. Display. Sell.', 'string', true],
            ['seo', 'meta_description', 'Categorize your products. Display them beautifully. Sell faster.', 'string', true],

            // Legal Policies (public)
            ['policies', 'policy_privacy', 'We respect your privacy and protect your personal information. Data collected during checkout or account registration is used solely to process orders, provide customer support, and improve your shopping experience. We never sell or share your personal data with unauthorized third parties.', 'string', true],
            ['policies', 'policy_privacy_ar', 'نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. تُستخدم البيانات المقدمة عند التسجيل أو إتمام الطلب فقط لتجهيز الطلبات وتقديم الدعم وتحسين تجربتك، ولا نشارك بياناتك مع أي أطراف غير مصرح لها.', 'string', true],
            ['policies', 'policy_terms', 'By placing an order on our store, you agree to provide accurate contact and delivery information. All prices include applicable store terms, and orders are subject to stock availability. We reserve the right to cancel or refuse orders in case of pricing errors or suspected fraud.', 'string', true],
            ['policies', 'policy_terms_ar', 'بإتمامك لأي طلب عبر المتجر، فإنك توافق على تقديم بيانات تواصل وتوصيل صحيحة. تخضع جميع الطلبات لتوفر المخزون، ويحق للمتجر إلغاء أي طلب في حال وجود خطأ تقني في السعر أو اشتباه في بيانات غير صحيحة.', 'string', true],
            ['policies', 'policy_refund', 'You may request a return or exchange within 14 days of delivery provided the item is unused, in its original packaging, and accompanied by the order receipt. Refunds for online payments are processed back to the original payment method within 5-10 business days after inspection.', 'string', true],
            ['policies', 'policy_refund_ar', 'يمكنك طلب الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ الاستلام بشرط أن يكون المنتج بحالته الأصلية ولم يُستخدم مع وجود فاتورة الطلب. يتم رد المبالغ المدفوعة إلكترونياً خلال 5 إلى 10 أيام عمل بعد فحص المنتج.', 'string', true],
            ['policies', 'about_title', 'About Sannafly', 'string', true],
            ['policies', 'about_title_ar', 'عن صنّفلي', 'string', true],
            ['policies', 'about_body', 'Sannafly is built for modern merchants and shoppers who value clarity, quality, and speed. We organize curated products with transparent pricing, real-time stock, and reliable delivery.', 'string', true],
            ['policies', 'about_body_ar', 'صنّفلي منصة متكاملة صُممت للتجار والمتسوقين الباحثين عن الوضوح والجودة والسرعة. نعرض منتجات مختارة بعناية مع أسعار واضحة، ومخزون محدث لحظياً، وتوصيل موثوق.', 'string', true],

            // Promotions: Announcement / News Bar & Popup (public)
            ['promotions', 'promo_bar_enabled', true, 'boolean', true],
            ['promotions', 'promo_bar_marquee', true, 'boolean', true],
            ['promotions', 'promo_bar_text', 'Welcome to Sannafly! Use code WELCOME10 for 10% off your first order | Free shipping on orders over $200', 'string', true],
            ['promotions', 'promo_bar_text_ar', 'أهلاً بك في صنّفلي! استخدم كود WELCOME10 لخصم 10% على أول طلب | شحن مجاني للطلبات فوق 200$', 'string', true],
            ['promotions', 'promo_bar_bg', '#063F3C', 'string', true],
            ['promotions', 'promo_bar_text_color', '#FFFFFF', 'string', true],
            ['promotions', 'promo_bar_btn_text', 'Shop Now', 'string', true],
            ['promotions', 'promo_bar_btn_text_ar', 'تسوق الآن', 'string', true],
            ['promotions', 'promo_bar_btn_color', '#F6A21E', 'string', true],
            ['promotions', 'promo_bar_link', '/catalog', 'string', true],

            ['promotions', 'promo_popup_enabled', true, 'boolean', true],
            ['promotions', 'promo_popup_badge', 'LIMITED OFFER', 'string', true],
            ['promotions', 'promo_popup_badge_ar', 'عرض خاص', 'string', true],
            ['promotions', 'promo_popup_title', 'Get 10% Off Your First Order!', 'string', true],
            ['promotions', 'promo_popup_title_ar', 'احصل على خصم 10% على أول طلب لك!', 'string', true],
            ['promotions', 'promo_popup_body', 'Explore our curated collection and enjoy fast delivery. Apply the promo code below at checkout.', 'string', true],
            ['promotions', 'promo_popup_body_ar', 'تصفح تشكيلتنا المختارة واستمتع بشحن سريع. انسخ كود الخصم أدناه واستخدمه في السلة.', 'string', true],
            ['promotions', 'promo_popup_coupon', 'WELCOME10', 'string', true],
            ['promotions', 'promo_popup_bg', '#0A5C57', 'string', true],
            ['promotions', 'promo_popup_btn_text', 'Browse Catalog', 'string', true],
            ['promotions', 'promo_popup_btn_text_ar', 'تصفح المنتجات', 'string', true],
            ['promotions', 'promo_popup_link', '/catalog', 'string', true],
            ['promotions', 'promo_popup_delay', 2, 'integer', true],
        ];

        foreach ($defaults as [$group, $key, $value, $type, $isPublic]) {
            $settings->set($key, $value, $group, $type, $isPublic);
        }

        // Price Types
        $priceTypes = [
            ['slug' => 'regular', 'name' => 'Regular Price', 'name_ar' => 'السعر الأساسي', 'is_default' => true, 'sort_order' => 1],
            ['slug' => 'sale', 'name' => 'Sale Price', 'name_ar' => 'سعر العرض', 'is_default' => false, 'sort_order' => 2],
            ['slug' => 'wholesale', 'name' => 'Wholesale Price', 'name_ar' => 'سعر الجملة', 'is_default' => false, 'sort_order' => 3],
            ['slug' => 'retail', 'name' => 'Retail Price', 'name_ar' => 'سعر التجزئة', 'is_default' => false, 'sort_order' => 4],
            ['slug' => 'member', 'name' => 'Member Price', 'name_ar' => 'سعر الأعضاء', 'is_default' => false, 'sort_order' => 5],
        ];

        foreach ($priceTypes as $pt) {
            PriceType::query()->updateOrCreate(['slug' => $pt['slug']], $pt);
        }

        // Default Payment Methods
        $paymentMethods = [
            [
                'code' => 'cod',
                'name' => 'Cash on Delivery',
                'name_ar' => 'الدفع عند الاستلام',
                'driver' => 'cod',
                'description' => 'Pay in cash when your order arrives.',
                'description_ar' => 'ادفع نقداً عند استلام طلبك.',
                'is_active' => true,
                'is_visible' => true,
                'sort_order' => 1,
                'config' => ['instructions' => 'Please have the exact amount ready for the courier upon delivery.'],
            ],
            [
                'code' => 'bank_transfer',
                'name' => 'Bank Transfer',
                'name_ar' => 'تحويل بنكي',
                'driver' => 'bank_transfer',
                'description' => 'Direct bank transfer to our corporate account.',
                'description_ar' => 'تحويل بنكي مباشر إلى حساب الشركة.',
                'is_active' => true,
                'is_visible' => true,
                'sort_order' => 2,
                'config' => [
                    'bank_name' => 'CIB Egypt',
                    'account_name' => 'Sannafly Trading LLC',
                    'account_number' => '100045892341',
                    'iban' => 'EG380010000100000100045892341',
                ],
            ],
            [
                'code' => 'cash',
                'name' => 'Cash in Store (Pickup)',
                'name_ar' => 'الدفع والاستلام من المتجر',
                'driver' => 'cash',
                'description' => 'Pick up your order from our store with zero shipping fees.',
                'description_ar' => 'استلم طلبك من فرعنا وادفع نقداً بدون مصاريف شحن.',
                'is_active' => true,
                'is_visible' => true,
                'sort_order' => 3,
                'config' => [
                    'pickup_address' => '12 El-Tahrir St, Downtown, Cairo',
                    'pickup_hours' => 'Daily 10:00 AM - 10:00 PM',
                ],
            ],
            [
                'code' => 'myfatoorah',
                'name' => 'MyFatoorah (Cards / Apple Pay / KNET)',
                'name_ar' => 'ماي فاتورة (بطاقات / الدفع الإلكتروني)',
                'driver' => 'myfatoorah',
                'description' => 'Pay securely online via MyFatoorah.',
                'description_ar' => 'ادفع إلكترونياً بأمان عبر بوابة ماي فاتورة.',
                'is_active' => false,
                'is_visible' => true,
                'sort_order' => 4,
                'config' => ['sandbox' => true, 'country' => 'EGY', 'api_key' => ''],
            ],
            [
                'code' => 'fawry',
                'name' => 'Fawry Pay (Reference / Card)',
                'name_ar' => 'فوري باي (كود دفع / بطاقة)',
                'driver' => 'fawry',
                'description' => 'Pay via Fawry reference number or bank card.',
                'description_ar' => 'ادفع عبر كود فوري في أي منفذ أو بالبطاقة البنكية.',
                'is_active' => false,
                'is_visible' => true,
                'sort_order' => 5,
                'config' => ['sandbox' => true, 'merchant_code' => '', 'security_key' => ''],
            ],
        ];

        foreach ($paymentMethods as $pm) {
            PaymentMethod::query()->updateOrCreate(['code' => $pm['code']], $pm);
        }
    }
}
