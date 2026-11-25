import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Check, Copy, Eye, LayoutGrid, Megaphone, Monitor, Package, Paintbrush, Palette, Smartphone, Sparkles, Tag, Type, X } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import { applyThemeSettings } from '@/lib/theme';

const THEME_PRESETS = [
    { name: 'Sannafly Petrol', nameAr: 'بترولي صنّفلي (الأساسي)', primary: '#0A5C57', accent: '#F6A21E', text: '#15211F', surface: 'warm', radius: 'rounded' },
    { name: 'Petrol Deep', nameAr: 'بترولي عميق', primary: '#063F3C', accent: '#109684', text: '#15211F', surface: 'clean', radius: 'rounded' },
    { name: 'Royal Indigo', nameAr: 'نيلي ملكي', primary: '#4338ca', accent: '#ec4899', text: '#1e1b4b', surface: 'clean', radius: 'rounded' },
    { name: 'Obsidian Gold', nameAr: 'أسود فاخر', primary: '#0f172a', accent: '#d97706', text: '#1c1917', surface: 'warm', radius: 'sharp' },
    { name: 'Crimson Studio', nameAr: 'قرمزي جريء', primary: '#be123c', accent: '#FF6B4A', text: '#18181b', surface: 'pure', radius: 'pill' },
    { name: 'Oceanic Blue', nameAr: 'أزرق محيطي', primary: '#1d4ed8', accent: '#06b6d4', text: '#0f172a', surface: 'slate', radius: 'rounded' },
];

export default function Customizer({
    appearance,
    general,
    promotions = {},
}: {
    appearance: Record<string, any>;
    general: Record<string, any>;
    promotions?: Record<string, any>;
}) {
    const { t, locale } = useTranslation();
    const [tab, setTab] = useState<'brand' | 'hero' | 'layout' | 'promos'>('brand');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    const [siteName, setSiteName] = useState(general.site_name || 'Sannafly');
    const [siteNameAr, setSiteNameAr] = useState(general.site_name_ar || 'كتالوج فلو');
    const [siteDesc, setSiteDesc] = useState(general.site_description || '');
    const [siteDescAr, setSiteDescAr] = useState(general.site_description_ar || '');
    const [whatsapp, setWhatsapp] = useState(general.whatsapp_number || '');

    const [primaryColor, setPrimaryColor] = useState(appearance.primary_color || '#0f766e');
    const [accentColor, setAccentColor] = useState(appearance.accent_color || '#f59e0b');
    const [textColor, setTextColor] = useState(appearance.text_color || '#0f172a');
    const [themeSurface, setThemeSurface] = useState(appearance.theme_surface || 'clean');
    const [borderRadius, setBorderRadius] = useState(appearance.border_radius || 'rounded');
    const [heroTitle, setHeroTitle] = useState(appearance.hero_title || '');
    const [heroTitleAr, setHeroTitleAr] = useState(appearance.hero_title_ar || '');
    const [heroSubtitle, setHeroSubtitle] = useState(appearance.hero_subtitle || '');
    const [heroSubtitleAr, setHeroSubtitleAr] = useState(appearance.hero_subtitle_ar || '');
    const [showHero, setShowHero] = useState(Boolean(appearance.show_hero ?? true));
    const [showFeatured, setShowFeatured] = useState(Boolean(appearance.show_featured ?? true));
    const [showCategories, setShowCategories] = useState(Boolean(appearance.show_categories ?? true));
    const [showBrands, setShowBrands] = useState(Boolean(appearance.show_brands ?? true));
    const [gridCols, setGridCols] = useState<number>(Number(appearance.product_grid_columns ?? 4));
    const [imageRatio, setImageRatio] = useState<string>(appearance.image_ratio || 'square');

    // Promotions: Top Bar & Popup
    const [promoBarEnabled, setPromoBarEnabled] = useState(Boolean(promotions.promo_bar_enabled ?? true));
    const [promoBarMarquee, setPromoBarMarquee] = useState(Boolean(promotions.promo_bar_marquee ?? true));
    const [promoBarText, setPromoBarText] = useState(promotions.promo_bar_text || '');
    const [promoBarTextAr, setPromoBarTextAr] = useState(promotions.promo_bar_text_ar || '');
    const [promoBarBg, setPromoBarBg] = useState(promotions.promo_bar_bg || '#063F3C');
    const [promoBarTextColor, setPromoBarTextColor] = useState(promotions.promo_bar_text_color || '#FFFFFF');
    const [promoBarBtnText, setPromoBarBtnText] = useState(promotions.promo_bar_btn_text || 'Shop Now');
    const [promoBarBtnTextAr, setPromoBarBtnTextAr] = useState(promotions.promo_bar_btn_text_ar || 'تسوق الآن');
    const [promoBarBtnColor, setPromoBarBtnColor] = useState(promotions.promo_bar_btn_color || '#F6A21E');
    const [promoBarLink, setPromoBarLink] = useState(promotions.promo_bar_link || '/catalog');

    const [promoPopupEnabled, setPromoPopupEnabled] = useState(Boolean(promotions.promo_popup_enabled ?? true));
    const [promoPopupBadge, setPromoPopupBadge] = useState(promotions.promo_popup_badge || 'LIMITED OFFER');
    const [promoPopupBadgeAr, setPromoPopupBadgeAr] = useState(promotions.promo_popup_badge_ar || 'عرض خاص');
    const [promoPopupTitle, setPromoPopupTitle] = useState(promotions.promo_popup_title || '');
    const [promoPopupTitleAr, setPromoPopupTitleAr] = useState(promotions.promo_popup_title_ar || '');
    const [promoPopupBody, setPromoPopupBody] = useState(promotions.promo_popup_body || '');
    const [promoPopupBodyAr, setPromoPopupBodyAr] = useState(promotions.promo_popup_body_ar || '');
    const [promoPopupCoupon, setPromoPopupCoupon] = useState(promotions.promo_popup_coupon || '');
    const [promoPopupBg, setPromoPopupBg] = useState(promotions.promo_popup_bg || '#0A5C57');
    const [promoPopupBtnText, setPromoPopupBtnText] = useState(promotions.promo_popup_btn_text || 'Browse Catalog');
    const [promoPopupBtnTextAr, setPromoPopupBtnTextAr] = useState(promotions.promo_popup_btn_text_ar || 'تصفح المنتجات');
    const [promoPopupLink, setPromoPopupLink] = useState(promotions.promo_popup_link || '/catalog');
    const [promoPopupDelay, setPromoPopupDelay] = useState<number>(Number(promotions.promo_popup_delay ?? 2));
    const [popupPreviewOpen, setPopupPreviewOpen] = useState(false);

    useEffect(() => {
        applyThemeSettings({
            primary_color: primaryColor,
            accent_color: accentColor,
            text_color: textColor,
            theme_surface: themeSurface,
            border_radius: borderRadius,
        });
    }, [primaryColor, accentColor, textColor, themeSurface, borderRadius]);

    const colorPresets = ['#0f766e', '#1d4ed8', '#4338ca', '#be123c', '#0f172a', '#15803d'];

    const publish = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/settings', {
            items: [
                { key: 'site_name', value: siteName, group: 'general', type: 'string', is_public: true },
                { key: 'site_name_ar', value: siteNameAr, group: 'general', type: 'string', is_public: true },
                { key: 'site_description', value: siteDesc, group: 'general', type: 'string', is_public: true },
                { key: 'site_description_ar', value: siteDescAr, group: 'general', type: 'string', is_public: true },
                { key: 'whatsapp_number', value: whatsapp, group: 'general', type: 'string', is_public: true },
                { key: 'primary_color', value: primaryColor, group: 'appearance', type: 'string', is_public: true },
                { key: 'accent_color', value: accentColor, group: 'appearance', type: 'string', is_public: true },
                { key: 'text_color', value: textColor, group: 'appearance', type: 'string', is_public: true },
                { key: 'theme_surface', value: themeSurface, group: 'appearance', type: 'string', is_public: true },
                { key: 'border_radius', value: borderRadius, group: 'appearance', type: 'string', is_public: true },
                { key: 'hero_title', value: heroTitle, group: 'appearance', type: 'string', is_public: true },
                { key: 'hero_title_ar', value: heroTitleAr, group: 'appearance', type: 'string', is_public: true },
                { key: 'hero_subtitle', value: heroSubtitle, group: 'appearance', type: 'string', is_public: true },
                { key: 'hero_subtitle_ar', value: heroSubtitleAr, group: 'appearance', type: 'string', is_public: true },
                { key: 'show_hero', value: showHero, group: 'appearance', type: 'boolean', is_public: true },
                { key: 'show_featured', value: showFeatured, group: 'appearance', type: 'boolean', is_public: true },
                { key: 'show_categories', value: showCategories, group: 'appearance', type: 'boolean', is_public: true },
                { key: 'show_brands', value: showBrands, group: 'appearance', type: 'boolean', is_public: true },
                { key: 'product_grid_columns', value: gridCols, group: 'appearance', type: 'integer', is_public: true },
                { key: 'image_ratio', value: imageRatio, group: 'appearance', type: 'string', is_public: true },
                { key: 'promo_bar_enabled', value: promoBarEnabled, group: 'promotions', type: 'boolean', is_public: true },
                { key: 'promo_bar_marquee', value: promoBarMarquee, group: 'promotions', type: 'boolean', is_public: true },
                { key: 'promo_bar_text', value: promoBarText, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_text_ar', value: promoBarTextAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_bg', value: promoBarBg, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_text_color', value: promoBarTextColor, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_btn_text', value: promoBarBtnText, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_btn_text_ar', value: promoBarBtnTextAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_btn_color', value: promoBarBtnColor, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_bar_link', value: promoBarLink, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_enabled', value: promoPopupEnabled, group: 'promotions', type: 'boolean', is_public: true },
                { key: 'promo_popup_badge', value: promoPopupBadge, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_badge_ar', value: promoPopupBadgeAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_title', value: promoPopupTitle, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_title_ar', value: promoPopupTitleAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_body', value: promoPopupBody, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_body_ar', value: promoPopupBodyAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_coupon', value: promoPopupCoupon, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_bg', value: promoPopupBg, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_btn_text', value: promoPopupBtnText, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_btn_text_ar', value: promoPopupBtnTextAr, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_link', value: promoPopupLink, group: 'promotions', type: 'string', is_public: true },
                { key: 'promo_popup_delay', value: promoPopupDelay, group: 'promotions', type: 'integer', is_public: true },
            ],
        });
    };

    const ratioClass = imageRatio === 'portrait' ? 'aspect-[3/4]' : imageRatio === 'landscape' ? 'aspect-[4/3]' : 'aspect-square';

    return (
        <AdminLayout title={t('customizer')}>
            <Head title={t('customizer')} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left Controls Panel */}
                <form onSubmit={publish} className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                            { id: 'brand', label: locale === 'ar' ? 'الهوية' : 'Brand', icon: Paintbrush },
                            { id: 'hero', label: locale === 'ar' ? 'البانر' : 'Hero', icon: Type },
                            { id: 'layout', label: locale === 'ar' ? 'التخطيط' : 'Layout', icon: LayoutGrid },
                            { id: 'promos', label: locale === 'ar' ? 'الإعلانات' : 'Promos', icon: Megaphone },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTab(item.id as any)}
                                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                                        tab === item.id
                                            ? 'bg-white dark:bg-slate-900 text-teal-700 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                        {tab === 'brand' && (
                            <>
                                {/* Ready-made Theme Presets */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-bold mb-2 text-slate-600">
                                        <Palette className="w-3.5 h-3.5 text-teal-700" />
                                        <span>{locale === 'ar' ? 'قوالب ألوان وتصميم جاهزة' : 'Designer Theme Presets'}</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {THEME_PRESETS.map((preset) => {
                                            const active = primaryColor.toLowerCase() === preset.primary.toLowerCase();
                                            return (
                                                <button
                                                    key={preset.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setPrimaryColor(preset.primary);
                                                        setAccentColor(preset.accent);
                                                        setTextColor(preset.text);
                                                        setThemeSurface(preset.surface);
                                                        setBorderRadius(preset.radius);
                                                    }}
                                                    className={`p-2.5 rounded-xl border text-start transition-all ${
                                                        active ? 'border-teal-600 bg-teal-50/60 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                                                        </div>
                                                        {active && <Check className="w-3.5 h-3.5 text-teal-700" />}
                                                    </div>
                                                    <div className="text-[11px] font-bold truncate">
                                                        {locale === 'ar' ? preset.nameAr : preset.name}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Store Name (EN)</label>
                                        <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">اسم المتجر (عربي)</label>
                                        <input type="text" dir="rtl" value={siteNameAr} onChange={(e) => setSiteNameAr(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Description (EN)</label>
                                        <input type="text" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">الوصف (عربي)</label>
                                        <input type="text" dir="rtl" value={siteDescAr} onChange={(e) => setSiteDescAr(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
                                    <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="201000000000" className="w-full px-3 py-2 rounded-xl border text-sm font-mono" />
                                </div>
                                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold mb-2">{t('primary_color')}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-11 rounded-lg border cursor-pointer" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {colorPresets.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setPrimaryColor(c)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${primaryColor === c ? 'border-slate-900 scale-110' : 'border-white'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-2">Accent Color</label>
                                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-11 rounded-lg border cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-2">{locale === 'ar' ? 'لون النصوص' : 'Text Color'}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-11 rounded-lg border cursor-pointer" />
                                            <div className="flex gap-1.5">
                                                {['#0f172a', '#18181b', '#1c1917', '#1e1b4b', '#14532d'].map((tc) => (
                                                    <button
                                                        key={tc}
                                                        type="button"
                                                        onClick={() => setTextColor(tc)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${textColor === tc ? 'border-slate-900 scale-110' : 'border-white shadow-xs'}`}
                                                        style={{ backgroundColor: tc }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5">
                                            {locale === 'ar' ? 'خلفية المتجر' : 'Surface Background'}
                                        </label>
                                        <select
                                            value={themeSurface}
                                            onChange={(e) => setThemeSurface(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white"
                                        >
                                            <option value="clean">{locale === 'ar' ? 'أبيض هادئ (Clean)' : 'Clean Slate'}</option>
                                            <option value="warm">{locale === 'ar' ? 'دافئ فاخر (Warm)' : 'Warm Cream'}</option>
                                            <option value="slate">{locale === 'ar' ? 'رمادي ناعم (Soft)' : 'Soft Gray'}</option>
                                            <option value="pure">{locale === 'ar' ? 'أبيض ناصع (Pure)' : 'Pure White'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5">
                                            {locale === 'ar' ? 'استدارة الحواف' : 'Corner Style'}
                                        </label>
                                        <select
                                            value={borderRadius}
                                            onChange={(e) => setBorderRadius(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white"
                                        >
                                            <option value="sharp">{locale === 'ar' ? 'حادة (Sharp)' : 'Sharp'}</option>
                                            <option value="rounded">{locale === 'ar' ? 'دائرية متوازنة (Rounded)' : 'Rounded'}</option>
                                            <option value="pill">{locale === 'ar' ? 'ناعمة جداً (Soft Pill)' : 'Soft Pill'}</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'hero' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t('hero_title_en')}</label>
                                    <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t('hero_title_ar')}</label>
                                    <input type="text" dir="rtl" value={heroTitleAr} onChange={(e) => setHeroTitleAr(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t('hero_subtitle')} (EN)</label>
                                    <textarea rows={2} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t('hero_subtitle')} (AR)</label>
                                    <textarea rows={2} dir="rtl" value={heroSubtitleAr} onChange={(e) => setHeroSubtitleAr(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                            </>
                        )}

                        {tab === 'layout' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold mb-2">
                                        {locale === 'ar' ? 'عدد الأعمدة في شبكة المنتجات' : 'Product Grid Columns'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[2, 3, 4].map((cols) => (
                                            <button
                                                key={cols}
                                                type="button"
                                                onClick={() => setGridCols(cols)}
                                                className={`py-2 rounded-xl border text-xs font-semibold ${gridCols === cols ? 'bg-teal-700 text-white border-teal-700' : 'bg-white'}`}
                                            >
                                                {cols} Columns
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-2">
                                        {locale === 'ar' ? 'نسبة أبعاد صور المنتجات' : 'Product Card Image Ratio'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'square', label: '1:1 Square' },
                                            { id: 'portrait', label: '3:4 Portrait' },
                                            { id: 'landscape', label: '4:3 Wide' },
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setImageRatio(r.id)}
                                                className={`py-2 rounded-xl border text-xs font-semibold ${imageRatio === r.id ? 'bg-teal-700 text-white border-teal-700' : 'bg-white'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2.5 pt-2 text-sm">
                                    <label className="flex items-center gap-2.5"><input type="checkbox" checked={showHero} onChange={(e) => setShowHero(e.target.checked)} /> {t('show_hero')}</label>
                                    <label className="flex items-center gap-2.5"><input type="checkbox" checked={showCategories} onChange={(e) => setShowCategories(e.target.checked)} /> {t('show_categories')}</label>
                                    <label className="flex items-center gap-2.5"><input type="checkbox" checked={showFeatured} onChange={(e) => setShowFeatured(e.target.checked)} /> {t('show_featured')}</label>
                                    <label className="flex items-center gap-2.5"><input type="checkbox" checked={showBrands} onChange={(e) => setShowBrands(e.target.checked)} /> {locale === 'ar' ? 'إظهار العلامات التجارية' : 'Show Brands'}</label>
                                </div>
                            </>
                        )}

                        {tab === 'promos' && (
                            <div className="space-y-5">
                                {/* Top Announcement / News Bar */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                                        <span className="text-xs font-extrabold text-slate-800">
                                            {locale === 'ar' ? '1. شريط الإعلانات والأخبار العلوي' : '1. Top Announcement / News Bar'}
                                        </span>
                                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                            <input type="checkbox" checked={promoBarEnabled} onChange={(e) => setPromoBarEnabled(e.target.checked)} />
                                            <span>{locale === 'ar' ? 'تفعيل الشريط' : 'Enabled'}</span>
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                        <input type="checkbox" checked={promoBarMarquee} onChange={(e) => setPromoBarMarquee(e.target.checked)} />
                                        <span>{locale === 'ar' ? 'تحريك كنشرة أخبار متواصلة (Ticker)' : 'Scroll as News Ticker (Marquee)'}</span>
                                    </label>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            {locale === 'ar' ? 'نص الشريط بالإنجليزية (افصل الأخبار بعلامة |)' : 'Banner Text (EN) — separate items with |'}
                                        </label>
                                        <input type="text" dir="ltr" value={promoBarText} onChange={(e) => setPromoBarText(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            {locale === 'ar' ? 'نص الشريط بالعربية (افصل الأخبار بعلامة |)' : 'Banner Text (AR) — separate items with |'}
                                        </label>
                                        <input type="text" dir="rtl" value={promoBarTextAr} onChange={(e) => setPromoBarTextAr(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs bg-white" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'لون الخلفية' : 'Background'}
                                            </label>
                                            <input type="color" value={promoBarBg} onChange={(e) => setPromoBarBg(e.target.value)} className="h-9 w-full rounded-lg border cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'لون النص' : 'Text Color'}
                                            </label>
                                            <input type="color" value={promoBarTextColor} onChange={(e) => setPromoBarTextColor(e.target.value)} className="h-9 w-full rounded-lg border cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'لون الزر' : 'Button Color'}
                                            </label>
                                            <input type="color" value={promoBarBtnColor} onChange={(e) => setPromoBarBtnColor(e.target.value)} className="h-9 w-full rounded-lg border cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'نص الزر (إنجليزي)' : 'Button Label (EN)'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoBarBtnText} onChange={(e) => setPromoBarBtnText(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'نص الزر (عربي)' : 'Button Label (AR)'}
                                            </label>
                                            <input type="text" dir="rtl" value={promoBarBtnTextAr} onChange={(e) => setPromoBarBtnTextAr(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'رابط الزر (URL)' : 'Target Link'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoBarLink} onChange={(e) => setPromoBarLink(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white font-mono" />
                                        </div>
                                    </div>
                                </div>

                                {/* Promotional Popup */}
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                                        <span className="text-xs font-extrabold text-slate-800">
                                            {locale === 'ar' ? '2. الإعلان المنبثق (Pop-up)' : '2. Promotional Popup Modal'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPopupPreviewOpen(true)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold hover:bg-teal-100 transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'معاينة' : 'Preview'}</span>
                                            </button>
                                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                                <input type="checkbox" checked={promoPopupEnabled} onChange={(e) => setPromoPopupEnabled(e.target.checked)} />
                                                <span>{locale === 'ar' ? 'إظهار للزوار' : 'Show Popup'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'الشارة العلوية (إنجليزي)' : 'Badge Text (EN)'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoPopupBadge} onChange={(e) => setPromoPopupBadge(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'الشارة العلوية (عربي)' : 'Badge Text (AR)'}
                                            </label>
                                            <input type="text" dir="rtl" value={promoPopupBadgeAr} onChange={(e) => setPromoPopupBadgeAr(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'عنوان الإعلان (إنجليزي)' : 'Popup Title (EN)'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoPopupTitle} onChange={(e) => setPromoPopupTitle(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'عنوان الإعلان (عربي)' : 'Popup Title (AR)'}
                                            </label>
                                            <input type="text" dir="rtl" value={promoPopupTitleAr} onChange={(e) => setPromoPopupTitleAr(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            {locale === 'ar' ? 'تفاصيل العرض (إنجليزي)' : 'Popup Description (EN)'}
                                        </label>
                                        <textarea rows={2} dir="ltr" value={promoPopupBody} onChange={(e) => setPromoPopupBody(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            {locale === 'ar' ? 'تفاصيل العرض (عربي)' : 'Popup Description (AR)'}
                                        </label>
                                        <textarea rows={2} dir="rtl" value={promoPopupBodyAr} onChange={(e) => setPromoPopupBodyAr(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'كود الخصم (اختياري)' : 'Coupon Code'}
                                            </label>
                                            <input type="text" dir="ltr" placeholder="WELCOME10" value={promoPopupCoupon} onChange={(e) => setPromoPopupCoupon(e.target.value.toUpperCase())} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white font-mono uppercase" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'تأخير الظهور (ثواني)' : 'Delay (Seconds)'}
                                            </label>
                                            <input type="number" min={0} max={30} value={promoPopupDelay} onChange={(e) => setPromoPopupDelay(Number(e.target.value) || 0)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'لون رأس الإعلان' : 'Header Color'}
                                            </label>
                                            <input type="color" value={promoPopupBg} onChange={(e) => setPromoPopupBg(e.target.value)} className="h-9 w-full rounded-lg border cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'نص الزر (إنجليزي)' : 'Button Label (EN)'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoPopupBtnText} onChange={(e) => setPromoPopupBtnText(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'نص الزر (عربي)' : 'Button Label (AR)'}
                                            </label>
                                            <input type="text" dir="rtl" value={promoPopupBtnTextAr} onChange={(e) => setPromoPopupBtnTextAr(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {locale === 'ar' ? 'رابط الزر (URL)' : 'Target Link'}
                                            </label>
                                            <input type="text" dir="ltr" value={promoPopupLink} onChange={(e) => setPromoPopupLink(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border text-xs bg-white font-mono" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70">
                        <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm">
                            {t('publish_appearance')}
                        </button>
                    </div>
                </form>

                {/* Right Live Preview Panel */}
                <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                            <Eye className="w-4 h-4 text-teal-600" />
                            <span>{t('live_preview')}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setPreviewDevice('desktop')}
                                className={`p-1.5 rounded-lg ${previewDevice === 'desktop' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500'}`}
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewDevice('mobile')}
                                className={`p-1.5 rounded-lg ${previewDevice === 'mobile' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500'}`}
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className={`mx-auto w-full rounded-2xl border border-slate-200 overflow-hidden bg-white text-slate-900 shadow-sm transition-all ${previewDevice === 'mobile' ? 'max-w-[360px]' : ''}`}>
                        {promoBarEnabled && (
                            <div
                                className="px-3 py-1.5 text-[10px] font-semibold flex items-center justify-between gap-2"
                                style={{ backgroundColor: promoBarBg, color: promoBarTextColor }}
                            >
                                <span className="truncate">{locale === 'ar' ? promoBarTextAr : promoBarText}</span>
                                {(promoBarBtnText || promoBarBtnTextAr) && (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-950 shrink-0"
                                        style={{ backgroundColor: promoBarBtnColor }}
                                    >
                                        {locale === 'ar' ? promoBarBtnTextAr : promoBarBtnText}
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: primaryColor }}>
                                <Sparkles className="w-4 h-4" />
                                <span>{locale === 'ar' ? siteNameAr : siteName}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{t('catalog')} • {t('cart')}</span>
                        </div>

                        {showHero && (
                            <div className="p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)` }}>
                                <div className="max-w-md relative z-10">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 text-slate-900" style={{ backgroundColor: accentColor }}>
                                        {locale === 'ar' ? 'كتالوج احترافي' : 'NEW COLLECTION'}
                                    </span>
                                    <div className="text-lg font-bold leading-snug">{locale === 'ar' ? heroTitleAr : heroTitle}</div>
                                    <div className="text-xs text-white/80 mt-1.5 line-clamp-2">{locale === 'ar' ? heroSubtitleAr : heroSubtitle}</div>
                                    <span className="inline-block mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                                        {t('browse_all')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="p-5 space-y-5">
                            {showCategories && (
                                <div className="grid grid-cols-3 gap-2">
                                    {['Electronics', 'Audio', 'Workspace'].map((c) => (
                                        <div key={c} className="p-2.5 rounded-xl bg-slate-50 border text-[11px] font-semibold text-center">
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showFeatured && (
                                <div className={`grid gap-3 ${previewDevice === 'mobile' ? 'grid-cols-2' : gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                    {[1, 2, 3, 4].slice(0, previewDevice === 'mobile' ? 2 : gridCols).map((n) => (
                                        <div key={n} className="rounded-xl border border-slate-200 overflow-hidden">
                                            <div className={`${ratioClass} bg-slate-100 flex items-center justify-center`}>
                                                <Package className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <div className="p-2">
                                                <div className="h-2.5 w-3/4 bg-slate-200 rounded mb-1.5" />
                                                <div className="text-xs font-bold" style={{ color: primaryColor }}>$149.00</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Live Promotional Popup Preview Modal */}
            {popupPreviewOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setPopupPreviewOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="p-6 text-white relative"
                            style={{ background: `linear-gradient(135deg, #063F3C 0%, ${promoPopupBg || '#0A5C57'} 100%)` }}
                        >
                            <button
                                type="button"
                                onClick={() => setPopupPreviewOpen(false)}
                                className="absolute top-4 end-4 p-1.5 rounded-full bg-white/15 text-white hover:bg-white/25"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {(promoPopupBadge || promoPopupBadgeAr) && (
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold text-slate-950 mb-3"
                                    style={{ backgroundColor: accentColor || '#F6A21E' }}
                                >
                                    {locale === 'ar' ? promoPopupBadgeAr : promoPopupBadge}
                                </span>
                            )}
                            <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">
                                {locale === 'ar' ? promoPopupTitleAr : promoPopupTitle}
                            </h3>
                        </div>

                        <div className="p-6 space-y-5 text-center">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {locale === 'ar' ? promoPopupBodyAr : promoPopupBody}
                            </p>

                            {promoPopupCoupon && (
                                <div className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-50/70 flex items-center justify-center gap-2.5 text-teal-900 font-mono font-extrabold text-base">
                                    <Tag className="w-4 h-4 text-teal-700" />
                                    <span>{promoPopupCoupon}</span>
                                    <Copy className="w-4 h-4 text-teal-600 ms-1" />
                                </div>
                            )}

                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setPopupPreviewOpen(false)}
                                    className="flex-1 py-3 px-5 rounded-xl text-white font-bold text-sm shadow-sm"
                                    style={{ backgroundColor: promoPopupBg || '#0A5C57' }}
                                >
                                    {(locale === 'ar' ? promoPopupBtnTextAr : promoPopupBtnText) || t('browse_all')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPopupPreviewOpen(false)}
                                    className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                                >
                                    {locale === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
