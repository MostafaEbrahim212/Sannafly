import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Globe, Package, Paintbrush, Search, Settings as SettingsIcon, Sliders, Store } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import { applyThemeSettings } from '@/lib/theme';

interface SettingMeta {
    en: string;
    ar: string;
    descEn: string;
    descAr: string;
}

const SETTING_META: Record<string, SettingMeta> = {
    site_name: {
        en: 'Store Name (English)',
        ar: 'اسم المنصة / المتجر (إنجليزي)',
        descEn: 'Displayed in the header, browser title, and print templates.',
        descAr: 'يظهر في الهيدر وعنوان المتصفح وقوالب الطباعة.',
    },
    site_name_ar: {
        en: 'Store Name (Arabic)',
        ar: 'اسم المنصة / المتجر (عربي)',
        descEn: 'Displayed when the interface language is switched to Arabic.',
        descAr: 'يظهر عندما تكون لغة الواجهة باللغة العربية.',
    },
    site_description: {
        en: 'Store Description (English)',
        ar: 'وصف المتجر (إنجليزي)',
        descEn: 'Short tagline shown in the storefront footer.',
        descAr: 'نبذة قصيرة تظهر في تذييل الموقع (Footer).',
    },
    site_description_ar: {
        en: 'Store Description (Arabic)',
        ar: 'وصف المتجر (عربي)',
        descEn: 'Arabic tagline shown in the storefront footer.',
        descAr: 'نبذة قصيرة بالعربية تظهر في تذييل الموقع.',
    },
    contact_email: {
        en: 'Contact Email',
        ar: 'البريد الإلكتروني للتواصل',
        descEn: 'Primary email address for customer inquiries and notifications.',
        descAr: 'البريد الأساسي لاستقبال استفسارات العملاء.',
    },
    contact_phone: {
        en: 'Contact Phone',
        ar: 'رقم الهاتف للتواصل',
        descEn: 'Customer service phone number.',
        descAr: 'رقم هاتف خدمة العملاء.',
    },
    whatsapp_number: {
        en: 'WhatsApp Number',
        ar: 'رقم الواتساب',
        descEn: 'International format without + (e.g. 201000000000) used for direct product inquiries.',
        descAr: 'بالصيغة الدولية بدون + (مثال: 201000000000) لزر الاستفسار المباشر.',
    },
    currency: {
        en: 'Currency Code',
        ar: 'رمز العملة (ISO)',
        descEn: 'Three-letter currency code such as USD, EGP, SAR.',
        descAr: 'رمز العملة من 3 أحرف مثل USD أو EGP أو SAR.',
    },
    currency_symbol: {
        en: 'Currency Symbol',
        ar: 'علامة العملة',
        descEn: 'Symbol displayed next to all prices (e.g. $, ج.م, ر.س).',
        descAr: 'العلامة التي تظهر بجانب الأسعار في المتجر ولوحة التحكم.',
    },
    module_ecommerce: {
        en: 'E-Commerce Mode',
        ar: 'تفعيل وضع التجارة الإلكترونية (البيع أونلاين)',
        descEn: 'When disabled, the platform runs purely as a product catalog without cart or orders.',
        descAr: 'عند تعطيله يعمل الموقع ككتالوج عرض واستفسارات فقط بدون سلة أو طلبات.',
    },
    module_cart: {
        en: 'Shopping Cart',
        ar: 'سلة المشتريات',
        descEn: 'Allows visitors to add products to a shopping cart.',
        descAr: 'يسمح للزوار بإضافة المنتجات إلى سلة المشتريات.',
    },
    module_checkout: {
        en: 'Online Checkout',
        ar: 'إتمام الطلب أونلاين (Checkout)',
        descEn: 'Enables order submission and payment method selection.',
        descAr: 'يفعّل صفحة إتمام الطلب واختيار طريقة الدفع.',
    },
    module_guest_checkout: {
        en: 'Guest Checkout',
        ar: 'الطلب كزائر بدون تسجيل حساب',
        descEn: 'Customers can place orders without creating an account first.',
        descAr: 'يسمح للعملاء بإرسال الطلبات مباشرة دون إنشاء حساب.',
    },
    module_stock: {
        en: 'Show Stock on Storefront',
        ar: 'عرض حالة المخزون في المتجر',
        descEn: 'Displays In Stock / Out of Stock counts on product pages.',
        descAr: 'يعرض توفر المنتج والكمية المتبقية في صفحة المنتج.',
    },
    module_brands: {
        en: 'Brands Module',
        ar: 'نظام العلامات التجارية',
        descEn: 'Show brands filter and brands section on the storefront.',
        descAr: 'إظهار العلامات التجارية في الصفحة الرئيسية وفلاتر البحث.',
    },
    module_variations: {
        en: 'Product Variations',
        ar: 'خيارات ومتغيرات المنتجات',
        descEn: 'Enable attributes like Color and Size with separate SKUs and stock.',
        descAr: 'تفعيل الخصائص مثل اللون والمقاس لكل منتج.',
    },
    module_custom_pricing: {
        en: 'Multi-Tier Pricing',
        ar: 'الأسعار المتعددة (جملة / أعضاء)',
        descEn: 'Support wholesale, retail, member, and quantity-based pricing.',
        descAr: 'دعم أسعار الجملة والتجزئة والكميات.',
    },
    module_whatsapp: {
        en: 'WhatsApp Contact Button',
        ar: 'زر التواصل عبر واتساب',
        descEn: 'Shows a direct WhatsApp inquiry button on product pages and footer.',
        descAr: 'يُظهر زر استفسار مباشر عبر واتساب في صفحة المنتج والتذييل.',
    },
    module_inquiries: {
        en: 'Product Inquiry Form',
        ar: 'نموذج استفسار المنتجات',
        descEn: 'Lets customers send questions directly from any product page.',
        descAr: 'يتيح للعملاء إرسال استفساراتهم من داخل صفحة المنتج.',
    },
    default_low_stock_threshold: {
        en: 'Default Low Stock Alert',
        ar: 'حد التنبيه الافتراضي لنقص المخزون',
        descEn: 'Products at or below this quantity are flagged as low stock.',
        descAr: 'يتم تنبيهك عندما يصل مخزون المنتج لهذا الرقم أو أقل.',
    },
    image_max_width: {
        en: 'Max Image Width (px)',
        ar: 'أقصى عرض للصورة (بكسل)',
        descEn: 'Uploaded images larger than this width are automatically resized.',
        descAr: 'يتم تصغير الصور الكبيرة تلقائياً لهذا العرض لتسريع الموقع.',
    },
    image_thumb_width: {
        en: 'Thumbnail Width (px)',
        ar: 'عرض الصورة المصغرة (بكسل)',
        descEn: 'Width of generated thumbnail images used in product grids.',
        descAr: 'عرض الصور المصغرة المستخدمة في قوائم المنتجات.',
    },
    image_quality: {
        en: 'WebP Image Quality (%)',
        ar: 'جودة ضغط صور WebP (%)',
        descEn: 'Compression quality from 1 to 100 (recommended: 80–90).',
        descAr: 'نسبة جودة ضغط الصور من 1 إلى 100 (الموصى به: 85).',
    },
    default_locale: {
        en: 'Default Language',
        ar: 'اللغة الافتراضية للمنصة',
        descEn: 'Initial language for first-time visitors (en or ar).',
        descAr: 'اللغة التي تفتح بها المنصة للزوار الجدد (en أو ar).',
    },
    enable_arabic: {
        en: 'Enable Arabic (RTL)',
        ar: 'تفعيل اللغة العربية (RTL)',
        descEn: 'Allows switching between Arabic and English.',
        descAr: 'يتيح التبديل بين اللغة العربية والإنجليزية.',
    },
    meta_title: {
        en: 'Default SEO Title',
        ar: 'عنوان SEO الافتراضي',
        descEn: 'Default page title shown in Google search results.',
        descAr: 'العنوان الافتراضي الذي يظهر في محركات البحث.',
    },
    meta_description: {
        en: 'Default SEO Description',
        ar: 'وصف SEO الافتراضي',
        descEn: 'Default meta description for search engines.',
        descAr: 'الوصف التعريفي الافتراضي لمحركات البحث.',
    },
    primary_color: {
        en: 'Primary Brand Color',
        ar: 'اللون الأساسي للهوية',
        descEn: 'Main color applied across buttons, links, badges, and highlights.',
        descAr: 'اللون الرئيسي المستخدم في الأزرار والروابط والشارات في المتجر واللوحة.',
    },
    accent_color: {
        en: 'Accent / Highlight Color',
        ar: 'اللون الثانوي (Accent)',
        descEn: 'Secondary highlight color used for featured badges and accents.',
        descAr: 'اللون المميز المستخدم في الشارات الترويجية والتفاصيل.',
    },
    text_color: {
        en: 'Primary Text Color',
        ar: 'لون النصوص الرئيسي',
        descEn: 'Base text and heading color used across the storefront.',
        descAr: 'لون العناوين والنصوص الأساسي في صفحات المتجر واللوحة.',
    },
    theme_surface: {
        en: 'Storefront Background Surface',
        ar: 'لون خلفية المتجر',
        descEn: 'Overall background tone of the storefront pages.',
        descAr: 'درجة لون الخلفية العامة لصفحات المتجر.',
    },
    border_radius: {
        en: 'Corner & Button Radius',
        ar: 'استدارة الحواف والأزرار',
        descEn: 'Controls how sharp or rounded cards and buttons appear.',
        descAr: 'تتحكم في درجة استدارة الكروت والأزرار في الموقع.',
    },
    hero_title: {
        en: 'Hero Banner Title (English)',
        ar: 'عنوان البانر الرئيسي (إنجليزي)',
        descEn: 'Main headline displayed in the homepage hero section.',
        descAr: 'العنوان الرئيسي الذي يظهر في واجهة الصفحة الرئيسية.',
    },
    hero_title_ar: {
        en: 'Hero Banner Title (Arabic)',
        ar: 'عنوان البانر الرئيسي (عربي)',
        descEn: 'Arabic headline displayed in the homepage hero section.',
        descAr: 'العنوان الرئيسي بالعربية في واجهة الصفحة الرئيسية.',
    },
    hero_subtitle: {
        en: 'Hero Subtitle (English)',
        ar: 'الوصف الفرعي للبانر (إنجليزي)',
        descEn: 'Supporting description under the homepage hero headline.',
        descAr: 'النص التعريفي أسفل عنوان البانر الرئيسي.',
    },
    hero_subtitle_ar: {
        en: 'Hero Subtitle (Arabic)',
        ar: 'الوصف الفرعي للبانر (عربي)',
        descEn: 'Arabic supporting description under the homepage hero headline.',
        descAr: 'النص التعريفي بالعربية أسفل عنوان البانر الرئيسي.',
    },
    show_hero: {
        en: 'Show Hero Banner',
        ar: 'إظهار البانر الرئيسي',
        descEn: 'Display the hero banner at the top of the homepage.',
        descAr: 'عرض قسم الترحيب والبانر أعلى الصفحة الرئيسية.',
    },
    show_featured: {
        en: 'Show Featured Products',
        ar: 'إظهار المنتجات المميزة',
        descEn: 'Display the featured products section on the homepage.',
        descAr: 'عرض قسم المنتجات المميزة في الصفحة الرئيسية.',
    },
    show_categories: {
        en: 'Show Categories Section',
        ar: 'إظهار قسم التصنيفات',
        descEn: 'Display category cards on the homepage.',
        descAr: 'عرض بطاقات الأقسام في الصفحة الرئيسية.',
    },
    show_brands: {
        en: 'Show Brands Section',
        ar: 'إظهار قسم العلامات التجارية',
        descEn: 'Display brand logos strip on the homepage.',
        descAr: 'عرض شريط العلامات التجارية في الصفحة الرئيسية.',
    },
    product_grid_columns: {
        en: 'Product Grid Columns',
        ar: 'عدد الأعمدة في شبكة المنتجات',
        descEn: 'Number of product cards per row on desktop screens.',
        descAr: 'عدد كروت المنتجات في كل صف على الشاشات الكبيرة.',
    },
    image_ratio: {
        en: 'Product Image Aspect Ratio',
        ar: 'نسبة أبعاد صور المنتجات',
        descEn: 'Aspect ratio used across all product cards in the store.',
        descAr: 'نسبة الطول للعرض لصور المنتجات في الكتالوج.',
    },
    policy_privacy: { en: 'Privacy Policy (EN)', ar: 'سياسة الخصوصية (إنجليزي)', descEn: 'Shown on /policies/privacy-policy', descAr: 'تظهر في صفحة سياسة الخصوصية' },
    policy_privacy_ar: { en: 'Privacy Policy (AR)', ar: 'سياسة الخصوصية (عربي)', descEn: 'Arabic Privacy Policy text', descAr: 'نص سياسة الخصوصية باللغة العربية' },
    policy_terms: { en: 'Terms & Conditions (EN)', ar: 'الشروط والأحكام (إنجليزي)', descEn: 'Shown on /policies/terms', descAr: 'تظهر في صفحة الشروط والأحكام' },
    policy_terms_ar: { en: 'Terms & Conditions (AR)', ar: 'الشروط والأحكام (عربي)', descEn: 'Arabic Terms & Conditions text', descAr: 'نص الشروط والأحكام باللغة العربية' },
    policy_refund: { en: 'Return & Refund Policy (EN)', ar: 'سياسة الاسترجاع (إنجليزي)', descEn: 'Shown on /policies/refund-policy', descAr: 'تظهر في صفحة الاستبدال والاسترجاع' },
    policy_refund_ar: { en: 'Return & Refund Policy (AR)', ar: 'سياسة الاسترجاع (عربي)', descEn: 'Arabic Return & Refund Policy text', descAr: 'نص سياسة الاستبدال والاسترجاع بالعربية' },
};

export default function SettingsIndex({ settingsGroups }: { settingsGroups: Record<string, any[]> }) {
    const { t, locale } = useTranslation();
    const groups = Object.keys(settingsGroups);
    const [activeGroup, setActiveGroup] = useState<string>(groups.includes('general') ? 'general' : groups[0] || 'general');

    const initial: Record<string, any> = {};
    Object.values(settingsGroups).flat().forEach((s: any) => {
        initial[s.key] = s.type === 'boolean' ? s.value === '1' || s.value === 'true' : s.value;
    });
    const [values, setValues] = useState<Record<string, any>>(initial);

    const groupMeta: Record<string, { en: string; ar: string; icon: any }> = {
        general: { en: 'General', ar: 'الإعدادات العامة', icon: Store },
        modules: { en: 'Modules & Features', ar: 'الوحدات والمميزات', icon: Sliders },
        products: { en: 'Products & Images', ar: 'المنتجات والصور', icon: Package },
        appearance: { en: 'Appearance', ar: 'المظهر والتصميم', icon: Paintbrush },
        localization: { en: 'Localization', ar: 'اللغة والمنطقة', icon: Globe },
        seo: { en: 'SEO & Search', ar: 'تحسين محركات البحث (SEO)', icon: Search },
        policies: { en: 'Legal & Policies', ar: 'السياسات والشروط', icon: Store },
        promotions: { en: 'Promotions & Popups', ar: 'الإعلانات والبوب أب', icon: Paintbrush },
    };

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        const items = Object.values(settingsGroups).flat().map((s: any) => ({
            key: s.key,
            value: values[s.key],
            group: s.group,
            type: s.type,
            is_public: Boolean(s.is_public),
        }));
        router.post('/admin/settings', { items });
    };

    const activeRows = settingsGroups[activeGroup] || [];

    return (
        <AdminLayout title={t('settings')}>
            <Head title={t('settings')} />

            <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Group Tabs */}
                <div className="lg:col-span-3 space-y-2">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-1 shadow-xs">
                        {groups.map((grp) => {
                            const meta = groupMeta[grp] || { en: grp, ar: grp, icon: SettingsIcon };
                            const Icon = meta.icon;
                            const isActive = activeGroup === grp;
                            return (
                                <button
                                    key={grp}
                                    type="button"
                                    onClick={() => setActiveGroup(grp)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-teal-700 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{locale === 'ar' ? meta.ar : meta.en}</span>
                                </button>
                            );
                        })}
                    </div>

                    <Link
                        href="/admin/customizer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors"
                    >
                        <Paintbrush className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'فتح مخصص المتجر المرئي' : 'Open Visual Customizer'}</span>
                    </Link>
                </div>

                {/* Right Settings Card */}
                <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-base">
                                {locale === 'ar' ? (groupMeta[activeGroup]?.ar || activeGroup) : (groupMeta[activeGroup]?.en || activeGroup)}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {locale === 'ar' ? 'عدّل الخيارات ثم اضغط حفظ التغييرات.' : 'Configure options below and save your changes.'}
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
                        >
                            {t('save')}
                        </button>
                    </div>

                    <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800">
                        {activeRows.map((row: any) => {
                            const meta = SETTING_META[row.key];
                            const label = meta ? (locale === 'ar' ? meta.ar : meta.en) : row.key;
                            const desc = meta ? (locale === 'ar' ? meta.descAr : meta.descEn) : '';
                            const isLongText = ['hero_title', 'hero_title_ar', 'hero_subtitle', 'hero_subtitle_ar', 'site_description', 'site_description_ar', 'meta_description', 'policy_privacy', 'policy_privacy_ar', 'policy_terms', 'policy_terms_ar', 'policy_refund', 'policy_refund_ar'].includes(row.key);
                            const isRtlField = row.key.endsWith('_ar');

                            return (
                                <div key={row.key} className={`py-4 first:pt-0 last:pb-0 flex flex-col ${isLongText ? 'gap-2.5' : 'sm:flex-row sm:items-center justify-between gap-4'}`}>
                                    <div className={isLongText ? '' : 'max-w-lg'}>
                                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{label}</div>
                                        {desc && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>}
                                    </div>

                                    <div className={isLongText ? 'w-full' : 'sm:w-80 shrink-0 flex justify-end'}>
                                        {row.type === 'boolean' ? (
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={Boolean(values[row.key])}
                                                onClick={() => setValues((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    values[row.key] ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        values[row.key]
                                                            ? locale === 'ar' ? '-translate-x-6' : 'translate-x-6'
                                                            : locale === 'ar' ? '-translate-x-1' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        ) : row.key === 'default_locale' ? (
                                            <select
                                                value={values[row.key] ?? 'en'}
                                                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                                            >
                                                <option value="en">English (LTR)</option>
                                                <option value="ar">العربية (RTL)</option>
                                            </select>
                                        ) : row.key === 'image_ratio' ? (
                                            <div className="grid grid-cols-3 gap-1.5 w-full">
                                                {[
                                                    { id: 'square', label: locale === 'ar' ? 'مربع 1:1' : 'Square 1:1' },
                                                    { id: 'portrait', label: locale === 'ar' ? 'طولي 3:4' : 'Portrait 3:4' },
                                                    { id: 'landscape', label: locale === 'ar' ? 'عريض 4:3' : 'Wide 4:3' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setValues((prev) => ({ ...prev, [row.key]: opt.id }))}
                                                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                                                            values[row.key] === opt.id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : row.key === 'product_grid_columns' ? (
                                            <div className="grid grid-cols-3 gap-1.5 w-full">
                                                {[2, 3, 4].map((cols) => (
                                                    <button
                                                        key={cols}
                                                        type="button"
                                                        onClick={() => setValues((prev) => ({ ...prev, [row.key]: String(cols) }))}
                                                        className={`py-2 rounded-xl border text-xs font-semibold transition-colors ${
                                                            String(values[row.key]) === String(cols) ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {cols} {locale === 'ar' ? 'أعمدة' : 'Cols'}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : row.key === 'theme_surface' ? (
                                            <select
                                                value={values[row.key] ?? 'clean'}
                                                onChange={(e) => {
                                                    const next = { ...values, [row.key]: e.target.value };
                                                    setValues(next);
                                                    applyThemeSettings(next);
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                                            >
                                                <option value="clean">{locale === 'ar' ? 'أبيض هادئ (Clean)' : 'Clean Slate'}</option>
                                                <option value="warm">{locale === 'ar' ? 'دافئ فاخر (Warm)' : 'Warm Cream'}</option>
                                                <option value="slate">{locale === 'ar' ? 'رمادي ناعم (Soft)' : 'Soft Gray'}</option>
                                                <option value="pure">{locale === 'ar' ? 'أبيض ناصع (Pure)' : 'Pure White'}</option>
                                            </select>
                                        ) : row.key === 'border_radius' ? (
                                            <select
                                                value={values[row.key] ?? 'rounded'}
                                                onChange={(e) => {
                                                    const next = { ...values, [row.key]: e.target.value };
                                                    setValues(next);
                                                    applyThemeSettings(next);
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                                            >
                                                <option value="sharp">{locale === 'ar' ? 'حادة (Sharp)' : 'Sharp'}</option>
                                                <option value="rounded">{locale === 'ar' ? 'دائرية متوازنة (Rounded)' : 'Rounded'}</option>
                                                <option value="pill">{locale === 'ar' ? 'ناعمة جداً (Soft Pill)' : 'Soft Pill'}</option>
                                            </select>
                                        ) : row.key.includes('color') ? (
                                            <div className="flex items-center gap-2.5 w-full justify-end">
                                                <div className="flex gap-1.5">
                                                    {['#0f766e', '#1d4ed8', '#4338ca', '#be123c', '#0f172a', '#f59e0b'].map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => {
                                                                const next = { ...values, [row.key]: c };
                                                                setValues(next);
                                                                applyThemeSettings(next);
                                                            }}
                                                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                                                String(values[row.key]).toLowerCase() === c ? 'border-slate-900 scale-110' : 'border-white shadow-xs'
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                                <input
                                                    type="color"
                                                    value={values[row.key] ?? '#0f766e'}
                                                    onChange={(e) => {
                                                        const next = { ...values, [row.key]: e.target.value };
                                                        setValues(next);
                                                        applyThemeSettings(next);
                                                    }}
                                                    className="h-9 w-12 rounded-lg border cursor-pointer shrink-0"
                                                />
                                            </div>
                                        ) : isLongText ? (
                                            <textarea
                                                rows={2}
                                                dir={isRtlField ? 'rtl' : 'ltr'}
                                                value={values[row.key] ?? ''}
                                                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                                            />
                                        ) : (
                                            <input
                                                type={row.type === 'integer' ? 'number' : 'text'}
                                                dir={isRtlField ? 'rtl' : 'ltr'}
                                                value={values[row.key] ?? ''}
                                                onChange={(e) => setValues((prev) => ({ ...prev, [row.key]: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white dark:bg-slate-800"
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-xs"
                        >
                            {t('save')}
                        </button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
