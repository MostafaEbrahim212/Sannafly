import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, FolderKanban, MessageCircle, ShieldCheck, Sparkles, Star, Truck, Zap } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import ProductCard from '@/Components/Storefront/ProductCard';
import { useTranslation } from '@/lib/i18n';
import type { Brand, Category, Product } from '@/types';

interface HomeProps {
    featuredProducts: Product[];
    latestProducts: Product[];
    categories: Category[];
    brands: Brand[];
}

export default function Home({ featuredProducts, latestProducts, categories, brands }: HomeProps) {
    const { t, localized, formatPrice, settings, dir, locale } = useTranslation();
    const spotlight = featuredProducts[0] || latestProducts[0] || null;
    const spotlightImg = spotlight?.images?.[0]?.thumbnail_path || spotlight?.images?.[0]?.path;
    const spotlightPrice = spotlight?.prices?.find((p) => p.price_type?.slug === 'sale')?.amount
        ?? spotlight?.prices?.[0]?.amount;
    const primaryColor = settings.primary_color || '#0f766e';
    const accentColor = settings.accent_color || '#f59e0b';
    const cols = Number(settings.product_grid_columns ?? 4);
    const gridClass =
        cols === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : cols === 3
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    const trustItems = [
        { icon: ShieldCheck, en: 'Verified Quality', ar: 'جودة مضمونة 100%' },
        { icon: Truck, en: 'Fast Fulfillment', ar: 'شحن وتوصيل سريع' },
        { icon: Zap, en: 'Live Stock & Pricing', ar: 'أسعار ومخزون محدث لحظياً' },
        { icon: MessageCircle, en: 'Direct Support', ar: 'دعم مباشر عبر واتساب' },
    ];

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const siteName = localized(settings.site_name || 'Sannafly', settings.site_name_ar);
    const homeSchemas = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            url: origin || '/',
            potentialAction: {
                '@type': 'SearchAction',
                target: `${origin}/catalog?search={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: siteName,
            url: origin || '/',
            email: settings.contact_email || undefined,
            telephone: settings.contact_phone || undefined,
        },
    ];

    return (
        <StorefrontLayout>
            <SeoHead
                title={localized(settings.meta_title || settings.site_name, settings.site_name_ar) || t('home')}
                description={localized(settings.meta_description || settings.site_description, settings.site_description_ar)}
                jsonLd={homeSchemas}
            />

            {settings.show_hero !== false && (
                <section
                    className="text-white relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, #063F3C 0%, ${primaryColor} 65%, #109684 100%)` }}
                >
                    {/* Ambient Decorative Glows */}
                    <div className="pointer-events-none absolute -top-24 -end-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
                    <div
                        className="pointer-events-none absolute -bottom-24 -start-24 w-80 h-80 rounded-full blur-3xl opacity-25"
                        style={{ backgroundColor: accentColor }}
                    />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7 animate-fade-up">
                            <div
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-slate-950 mb-5 shadow-md"
                                style={{ backgroundColor: accentColor }}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{localized(settings.site_name, settings.site_name_ar) || 'Sannafly'}</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-5">
                                {localized(settings.hero_title, settings.hero_title_ar)}
                            </h1>
                            <p className="text-white/85 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
                                {localized(settings.hero_subtitle, settings.hero_subtitle_ar)}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-extrabold text-slate-900 bg-white hover:bg-slate-100 hover:-translate-y-0.5 shadow-xl transition-all text-sm"
                                >
                                    <span>{t('browse_all')}</span>
                                    <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                </Link>
                                {settings.module_whatsapp && settings.whatsapp_number && (
                                    <a
                                        href={`https://wa.me/${settings.whatsapp_number}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur border border-white/25 text-sm transition-all"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{t('whatsapp_inquiry')}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Floating Spotlight Showcase Card */}
                        {spotlight && (
                            <div className="lg:col-span-5 hidden sm:flex justify-center lg:justify-end">
                                <Link
                                    href={`/products/${spotlight.slug}`}
                                    className="animate-float-slow group w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-2xl hover:bg-white/15 transition-all"
                                >
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/10 relative mb-4">
                                        {spotlightImg && (
                                            <img
                                                src={`/storage/${spotlightImg}`}
                                                alt={localized(spotlight.name, spotlight.name_ar)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                        <span
                                            className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-950 shadow-sm"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            <Star className="w-3 h-3 fill-current" />
                                            <span>{locale === 'ar' ? 'اختيار مميز' : 'SPOTLIGHT'}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 px-1">
                                        <div className="min-w-0">
                                            <div className="text-[11px] text-white/70 truncate">
                                                {spotlight.category ? localized(spotlight.category.name, spotlight.category.name_ar) : ''}
                                            </div>
                                            <div className="font-bold text-white truncate text-base">
                                                {localized(spotlight.name, spotlight.name_ar)}
                                            </div>
                                        </div>
                                        {spotlightPrice && (
                                            <span
                                                className="px-3 py-1.5 rounded-xl text-sm font-extrabold text-slate-950 shrink-0 shadow-sm"
                                                style={{ backgroundColor: accentColor }}
                                            >
                                                {formatPrice(spotlightPrice)}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Floating Trust Highlights Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-900/5 px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {trustItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.en} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span>{locale === 'ar' ? item.ar : item.en}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
                {settings.show_categories !== false && categories.length > 0 && (
                    <section className="animate-fade-up">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-extrabold tracking-tight">{t('categories')}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {locale === 'ar' ? 'تصفح حسب القسم للوصول الأسرع لمنتجاتك' : 'Explore curated collections by category'}
                                </p>
                            </div>
                            <Link href="/catalog" className="text-xs font-bold px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                                {t('view_all')}
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/catalog?category=${cat.slug}`}
                                    className="group p-5 rounded-2xl border border-slate-200/80 bg-white hover:shadow-lg hover:-translate-y-0.5 hover:border-teal-500/40 transition-all flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                            <FolderKanban className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                                                {localized(cat.name, cat.name_ar)}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {cat.products_count ?? 0} {t('products')}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 transition-transform group-hover:translate-x-0.5 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {settings.show_featured !== false && featuredProducts.length > 0 && (
                    <section className="animate-fade-up">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-extrabold tracking-tight">{t('featured_products')}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {locale === 'ar' ? 'أفضل المنتجات المختارة لك بعناية' : 'Hand-picked highlights from our catalog'}
                                </p>
                            </div>
                            <Link href="/catalog?featured=1" className="text-xs font-bold px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                                {t('browse_all')}
                            </Link>
                        </div>
                        <div className={`grid ${gridClass} gap-6`}>
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {latestProducts.length > 0 && (
                    <section className="animate-fade-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-extrabold tracking-tight">{t('latest_products')}</h2>
                            <Link href="/catalog" className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                {t('view_all')}
                            </Link>
                        </div>
                        <div className={`grid ${gridClass} gap-6`}>
                            {latestProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {settings.show_brands !== false && brands.length > 0 && (
                    <section className="pt-6 border-t border-slate-200/80">
                        <h2 className="text-lg font-bold mb-4 text-slate-700">{t('brands')}</h2>
                        <div className="flex flex-wrap gap-3">
                            {brands.map((b) => (
                                <Link
                                    key={b.id}
                                    href={`/catalog?brand=${b.slug}`}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:shadow-xs hover:border-teal-500/40 transition-all"
                                >
                                    {localized(b.name, b.name_ar)}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </StorefrontLayout>
    );
}
