import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Heart, Maximize2, MessageCircle, Minus, Package, Plus, ShieldCheck, ShoppingCart, Star, Truck, X } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import ProductCard from '@/Components/Storefront/ProductCard';
import { useTranslation } from '@/lib/i18n';
import type { PageProps, Product, ProductVariation } from '@/types';

interface ProductDetailProps {
    product: Product & { reviews?: Array<{ id: number; rating: number; title?: string; comment?: string; is_verified_purchase: boolean; created_at: string; customer?: { name: string } }> };
    relatedProducts: Product[];
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
    const { auth, wishlistIds = [] } = usePage<PageProps & { wishlistIds?: number[] }>().props;
    const { t, localized, formatPrice, settings, locale } = useTranslation();
    const isWishlisted = wishlistIds.includes(product.id);
    const [activeImage, setActiveImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedVar, setSelectedVar] = useState<ProductVariation | null>(
        product.variations?.find((v) => v.is_default) || product.variations?.[0] || null
    );
    const [qty, setQty] = useState(1);

    const reviewForm = useForm({
        rating: 5,
        title: '',
        comment: '',
    });

    const reviews = product.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

    const inquiryForm = useForm({
        product_id: product.id,
        variation_id: selectedVar?.id ?? null,
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const activeSku = selectedVar?.sku || product.sku;
    const activeStock = selectedVar ? selectedVar.stock_quantity : product.stock_quantity;
    const activePrices = selectedVar?.prices && selectedVar.prices.length > 0 ? selectedVar.prices : product.prices || [];
    const regularPrice = activePrices.find((p) => p.price_type?.slug === 'regular') || activePrices[0];
    const salePrice = activePrices.find((p) => p.price_type?.slug === 'sale');
    const primaryPrice = salePrice?.amount ?? regularPrice?.amount ?? '0';
    const hasDiscount = Boolean(salePrice && regularPrice && parseFloat(salePrice.amount) < parseFloat(regularPrice.amount));

    const baseImages = (product.images || []).filter((img) => !img.variation_id);
    const images = selectedVar?.images && selectedVar.images.length > 0
        ? selectedVar.images
        : baseImages.length > 0
            ? baseImages
            : (product.images || []);
    const currentImage = images[activeImage]?.path ?? images[0]?.path;

    const addToCart = () => {
        router.post(
            '/cart/add',
            {
                product_id: product.id,
                variation_id: selectedVar?.id ?? null,
                quantity: qty,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['cartCount', 'flash'],
            }
        );
    };

    const submitInquiry = (e: React.FormEvent) => {
        e.preventDefault();
        inquiryForm.post('/inquiries', {
            preserveScroll: true,
            onSuccess: () => inquiryForm.reset('name', 'email', 'phone', 'message'),
        });
    };

    const whatsappUrl = settings.whatsapp_number
        ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(`Hello, I am interested in ${product.name} (SKU: ${activeSku})`)}`
        : null;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const productTitle = localized(product.name, product.name_ar);
    const productJsonLd: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productTitle,
        sku: activeSku,
        description: localized(product.short_description || product.description, product.short_description_ar || product.description_ar),
        image: currentImage ? `${origin}/storage/${currentImage}` : undefined,
        brand: product.brand ? { '@type': 'Brand', name: localized(product.brand.name, product.brand.name_ar) } : undefined,
        category: product.category ? localized(product.category.name, product.category.name_ar) : undefined,
        offers: {
            '@type': 'Offer',
            url: `${origin}/products/${product.slug}`,
            price: parseFloat(String(primaryPrice || '0')).toFixed(2),
            priceCurrency: settings.currency || 'USD',
            availability: activeStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(reviews.length > 0 && avgRating
            ? {
                  aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: avgRating,
                      reviewCount: reviews.length,
                  },
              }
            : {}),
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t('home'), item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: t('catalog'), item: `${origin}/catalog` },
            ...(product.category
                ? [{ '@type': 'ListItem', position: 3, name: localized(product.category.name, product.category.name_ar), item: `${origin}/catalog?category=${product.category.slug}` }]
                : []),
            { '@type': 'ListItem', position: product.category ? 4 : 3, name: productTitle, item: `${origin}/products/${product.slug}` },
        ],
    };

    return (
        <StorefrontLayout>
            <SeoHead
                title={product.seo_title || productTitle}
                description={product.seo_description || localized(product.short_description || product.description, product.short_description_ar || product.description_ar)}
                image={currentImage ? `/storage/${currentImage}` : null}
                type="product"
                jsonLd={[productJsonLd, breadcrumbJsonLd]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Breadcrumbs */}
                <nav className="text-xs text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
                    <Link href="/" className="hover:text-teal-700">{t('home')}</Link>
                    <span>/</span>
                    <Link href="/catalog" className="hover:text-teal-700">{t('catalog')}</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-teal-700">
                                {localized(product.category.name, product.category.name_ar)}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-slate-700 font-medium truncate">{localized(product.name, product.name_ar)}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Gallery */}
                    <div className="lg:col-span-6">
                        <div
                            onClick={() => currentImage && setLightboxOpen(true)}
                            className={`aspect-square rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden relative group ${
                                currentImage ? 'cursor-zoom-in' : ''
                            }`}
                        >
                            {currentImage ? (
                                <>
                                    <img src={`/storage/${currentImage}`} alt={product.name} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-4 end-4 p-2.5 rounded-xl bg-black/55 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 className="w-4 h-4" />
                                    </span>
                                </>
                            ) : (
                                <Package className="w-24 h-24 text-slate-300" />
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-20 h-20 rounded-2xl border-2 overflow-hidden shrink-0 transition-all ${
                                            idx === activeImage ? 'border-teal-600 shadow-sm scale-105' : 'border-slate-200 opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={`/storage/${img.thumbnail_path || img.path}`} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Info */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
                            <div>
                                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-teal-700 mb-2">
                                    <span>
                                        {product.category ? localized(product.category.name, product.category.name_ar) : ''}
                                        {product.brand ? ` • ${localized(product.brand.name, product.brand.name_ar)}` : ''}
                                    </span>
                                    <span className="font-mono text-slate-400">{t('sku')}: {activeSku}</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                                    {localized(product.name, product.name_ar)}
                                </h1>
                            </div>

                            <div className="flex items-baseline gap-3 pt-1">
                                <span className="text-3xl font-extrabold text-teal-700">{formatPrice(primaryPrice)}</span>
                                {hasDiscount && regularPrice && (
                                    <span className="text-lg text-slate-400 line-through">{formatPrice(regularPrice.amount)}</span>
                                )}
                                {settings.module_stock !== false && (
                                    <span
                                        className={`ms-auto px-3 py-1 rounded-full text-xs font-bold ${
                                            activeStock > 0
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                    >
                                        {activeStock > 0 ? `${t('in_stock')} (${activeStock})` : t('out_of_stock')}
                                    </span>
                                )}
                            </div>

                            {activePrices.length > 1 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {activePrices.map((p) => (
                                        <span key={p.id} className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                                            {localized(p.price_type?.name, p.price_type?.name_ar)}: {formatPrice(p.amount)} {p.min_quantity > 1 ? `(${p.min_quantity}+)` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-4">
                                {localized(product.description || product.short_description, product.description_ar || product.short_description_ar)}
                            </p>

                            {product.variations && product.variations.length > 0 && (
                                <div className="pt-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">{t('options')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variations.map((v) => {
                                            const colorOpt = v.options?.find((o) => o.color_hex);
                                            const active = selectedVar?.id === v.id;
                                            return (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVar(v);
                                                        setActiveImage(0);
                                                    }}
                                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                                                        active
                                                            ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    {colorOpt?.color_hex && (
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                                            style={{ backgroundColor: colorOpt.color_hex }}
                                                        />
                                                    )}
                                                    <span>{v.name || v.sku}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                                {settings.module_ecommerce && settings.module_cart && (
                                    <>
                                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                                            <button
                                                type="button"
                                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                                className="p-3 text-slate-600 hover:text-slate-900"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center text-sm font-bold">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQty((q) => q + 1)}
                                                className="p-3 text-slate-600 hover:text-slate-900"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={addToCart}
                                            disabled={activeStock <= 0 && !product.allow_backorder}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm disabled:opacity-50 transition-colors"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span>{t('add_to_cart')}</span>
                                        </button>
                                    </>
                                )}

                                {settings.module_whatsapp && whatsappUrl && (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>{t('whatsapp_inquiry')}</span>
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!auth.customer) router.get('/login');
                                        else router.post('/wishlist/toggle', { product_id: product.id }, { preserveScroll: true, preserveState: true, only: ['wishlistIds', 'flash'] });
                                    }}
                                    className={`p-3.5 rounded-xl border transition-colors ${
                                        isWishlisted ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:text-rose-500'
                                    }`}
                                    aria-label="Toggle wishlist"
                                >
                                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                                    <span>{locale === 'ar' ? 'ضمان الجودة والأصالة' : 'Authentic Quality Guarantee'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-teal-600" />
                                    <span>{locale === 'ar' ? 'توصيل سريع وآمن' : 'Fast & Secure Delivery'}</span>
                                </div>
                            </div>
                        </div>

                        {settings.module_inquiries !== false && (
                            <form onSubmit={submitInquiry} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                                <h3 className="font-bold text-sm">{t('send_inquiry')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder={t('your_name')}
                                        value={inquiryForm.data.name}
                                        onChange={(e) => inquiryForm.setData('name', e.target.value)}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder={t('phone_or_email')}
                                        value={inquiryForm.data.phone}
                                        onChange={(e) => inquiryForm.setData('phone', e.target.value)}
                                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                    />
                                </div>
                                <textarea
                                    rows={2}
                                    placeholder={t('your_message')}
                                    value={inquiryForm.data.message}
                                    onChange={(e) => inquiryForm.setData('message', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={inquiryForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                                >
                                    {t('send_inquiry')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Customer Reviews */}
                <section className="mt-16 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-extrabold">{locale === 'ar' ? 'تقييمات العملاء' : 'Customer Reviews'}</h2>
                            {avgRating ? (
                                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                                    <span className="font-bold text-slate-900">{avgRating}</span>
                                    <span>({reviews.length})</span>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 mt-1">{locale === 'ar' ? 'لا توجد تقييمات بعد.' : 'No reviews yet.'}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-4">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{rev.customer?.name || 'Customer'}</span>
                                            {rev.is_verified_purchase && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{locale === 'ar' ? 'شراء مؤكد' : 'Verified Purchase'}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-amber-400">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {rev.title && <div className="font-semibold text-sm text-slate-800">{rev.title}</div>}
                                    {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>}
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-5">
                            {auth.customer ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        reviewForm.post(`/products/${product.id}/reviews`, {
                                            preserveScroll: true,
                                            onSuccess: () => reviewForm.reset('title', 'comment'),
                                        });
                                    }}
                                    className="p-5 rounded-2xl border border-slate-200 space-y-3"
                                >
                                    <h3 className="font-bold text-sm">{locale === 'ar' ? 'أضف تقييمك' : 'Write a Review'}</h3>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => reviewForm.setData('rating', s)}
                                                className={s <= reviewForm.data.rating ? 'text-amber-400' : 'text-slate-300'}
                                            >
                                                <Star className="w-5 h-5 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'عنوان مختصر (اختياري)' : 'Headline (optional)'}
                                        value={reviewForm.data.title}
                                        onChange={(e) => reviewForm.setData('title', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                    <textarea
                                        rows={3}
                                        placeholder={locale === 'ar' ? 'شارك تجربتك مع المنتج...' : 'Share your experience...'}
                                        value={reviewForm.data.comment}
                                        onChange={(e) => reviewForm.setData('comment', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                    <button
                                        type="submit"
                                        disabled={reviewForm.processing}
                                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                                    >
                                        {locale === 'ar' ? 'نشر التقييم' : 'Submit Review'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-5 rounded-2xl border border-dashed text-center text-xs text-slate-500 space-y-2">
                                    <p>{locale === 'ar' ? 'سجل الدخول لإضافة تقييمك لهذا المنتج.' : 'Sign in to leave a review for this product.'}</p>
                                    <Link href="/login" className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold">
                                        {t('login')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {relatedProducts.length > 0 && (
                    <section className="mt-20">
                        <h2 className="text-2xl font-extrabold tracking-tight mb-6">{t('related_products')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((rp) => (
                                <ProductCard key={rp.id} product={rp} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {lightboxOpen && currentImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 end-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={`/storage/${currentImage}`}
                        alt={product.name}
                        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </StorefrontLayout>
    );
}
