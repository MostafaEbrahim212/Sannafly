import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import ProductCard from '@/Components/Storefront/ProductCard';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';
import type { Product } from '@/types';

export default function Wishlist({ products }: { products: Product[] }) {
    const { locale, t } = useTranslation();

    return (
        <StorefrontLayout>
            <SeoHead title={locale === 'ar' ? 'المفضلة' : 'Wishlist'} noIndex />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-2.5">
                    <Heart className="w-6 h-6 text-rose-500 fill-current" />
                    <span>{locale === 'ar' ? 'المنتجات المفضلة' : 'My Wishlist'}</span>
                </h1>

                {products.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center text-slate-500">
                        <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="mb-4">{locale === 'ar' ? 'قائمة المفضلة فارغة حالياً.' : 'Your wishlist is currently empty.'}</p>
                        <Link href="/catalog" className="inline-block px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold">
                            {t('browse_all')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
