import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, Heart, Package, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { PageProps, Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { auth, wishlistIds = [] } = usePage<PageProps & { wishlistIds?: number[] }>().props;
    const { t, localized, formatPrice, settings } = useTranslation();
    const isWishlisted = wishlistIds.includes(product.id);
    const [justAdded, setJustAdded] = useState(false);
    const primaryColor = settings.primary_color || '#0f766e';
    const accentColor = settings.accent_color || '#f59e0b';

    const ratioClass =
        settings.image_ratio === 'portrait'
            ? 'aspect-[3/4]'
            : settings.image_ratio === 'landscape'
            ? 'aspect-[4/3]'
            : 'aspect-square';

    const img = product.images?.[0]?.thumbnail_path || product.images?.[0]?.path;
    const regularPrice = product.prices?.find((p) => p.price_type?.slug === 'regular') || product.prices?.[0];
    const salePrice = product.prices?.find((p) => p.price_type?.slug === 'sale');
    const displayPrice = salePrice?.amount ?? regularPrice?.amount ?? '0';
    const hasDiscount = Boolean(salePrice && regularPrice && parseFloat(salePrice.amount) < parseFloat(regularPrice.amount));

    const quickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(
            '/cart/add',
            { product_id: product.id, quantity: 1 },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['cartCount', 'flash'],
                onSuccess: () => {
                    setJustAdded(true);
                    setTimeout(() => setJustAdded(false), 1200);
                },
            }
        );
    };

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth.customer) {
            router.get('/login');
            return;
        }
        router.post(
            '/wishlist/toggle',
            { product_id: product.id },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['wishlistIds', 'products', 'flash'],
            }
        );
    };

    return (
        <Link
            href={`/products/${product.slug}`}
            className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
        >
            <div className={`${ratioClass} bg-slate-50 flex items-center justify-center overflow-hidden relative`}>
                {img ? (
                    <img
                        src={`/storage/${img}`}
                        alt={localized(product.name, product.name_ar)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                )}

                <div className="absolute top-3 start-3 flex flex-col gap-1.5">
                    {hasDiscount && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                            SALE
                        </span>
                    )}
                    {product.is_featured && (
                        <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-950 shadow-xs"
                            style={{ backgroundColor: accentColor }}
                        >
                            {t('featured')}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={toggleWishlist}
                    className={`absolute top-3 end-3 p-2 rounded-full shadow-xs border transition-colors ${
                        isWishlisted
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white/90 text-slate-500 border-slate-200 hover:text-rose-500'
                    }`}
                    aria-label="Toggle wishlist"
                >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {settings.module_ecommerce && settings.module_cart && !product.has_variations && product.stock_quantity > 0 && (
                    <button
                        type="button"
                        onClick={quickAdd}
                        title={t('add_to_cart')}
                        className={`absolute bottom-3 end-3 p-2.5 rounded-xl backdrop-blur shadow-md transition-all duration-200 ${
                            justAdded
                                ? 'bg-emerald-600 text-white opacity-100 translate-y-0'
                                : 'bg-white/95 text-slate-800 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-slate-900 hover:text-white'
                        }`}
                    >
                        {justAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    </button>
                )}
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400 mb-1.5">
                        <span className="truncate">{localized(product.category?.name, product.category?.name_ar) || product.sku}</span>
                        {product.brand && (
                            <span className="truncate text-slate-500">{localized(product.brand.name, product.brand.name_ar)}</span>
                        )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                        {localized(product.name, product.name_ar)}
                    </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-base sm:text-lg" style={{ color: primaryColor }}>
                            {formatPrice(displayPrice)}
                        </span>
                        {hasDiscount && regularPrice && (
                            <span className="text-xs text-slate-400 line-through">
                                {formatPrice(regularPrice.amount)}
                            </span>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                        {product.stock_quantity > 0 ? t('in_stock') : t('out_of_stock')}
                    </span>
                </div>
            </div>
        </Link>
    );
}
