import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ProductPrint({ product }: { product: any }) {
    const { t, localized, formatPrice, dir, settings } = useTranslation();

    return (
        <div dir={dir} className="min-h-screen bg-slate-100 print:bg-white text-slate-900 p-6 sm:p-10 print:p-0">
            <Head title={`${t('print')}: ${localized(product.name, product.name_ar)}`} />

            <div className="no-print max-w-3xl mx-auto mb-6 flex justify-between items-center bg-white rounded-2xl border p-4 shadow-xs">
                <Link href={`/admin/products/${product.id}/edit`} className="px-3.5 py-2 rounded-xl border text-xs font-semibold">
                    ← {t('back')}
                </Link>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                    <Printer className="w-4 h-4" />
                    <span>{t('print_product_sheet')}</span>
                </button>
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl print:rounded-none border print:border-none p-8 shadow-sm print:shadow-none">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                    <div>
                        <div className="text-xs font-bold uppercase text-teal-700">{localized(settings.site_name, settings.site_name_ar) || 'Sannafly'}</div>
                        <h1 className="text-2xl font-extrabold mt-1">{localized(product.name, product.name_ar)}</h1>
                        <div className="text-xs font-mono text-slate-500 mt-1">{t('sku')}: {product.sku}</div>
                    </div>
                    {product.images?.[0] && (
                        <img src={`/storage/${product.images[0].thumbnail_path || product.images[0].path}`} alt="" className="w-24 h-24 rounded-xl object-cover border" />
                    )}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-6">
                    {localized(product.description || product.short_description, product.description_ar || product.short_description_ar)}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-50 border">
                        <h2 className="font-bold text-xs uppercase text-slate-500 mb-3">{t('price')}</h2>
                        <ul className="space-y-1.5 text-sm">
                            {product.prices?.map((p: any) => (
                                <li key={p.id} className="flex justify-between">
                                    <span>{localized(p.price_type?.name, p.price_type?.name_ar)}</span>
                                    <strong className="text-teal-800">{formatPrice(p.amount)}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {product.variations?.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 border">
                            <h2 className="font-bold text-xs uppercase text-slate-500 mb-3">{t('options')}</h2>
                            <ul className="space-y-1.5 text-xs">
                                {product.variations.map((v: any) => (
                                    <li key={v.id} className="flex justify-between">
                                        <span>{v.name}</span>
                                        <span className="font-mono text-slate-500">{v.sku}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
