import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Package, Printer } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function CatalogPrint({ products, template: initialTemplate }: { products: any[]; template: string }) {
    const { t, localized, formatPrice, dir, settings } = useTranslation();
    const [template, setTemplate] = useState(initialTemplate || 'catalog');

    return (
        <div dir={dir} className="min-h-screen bg-slate-100 print:bg-white text-slate-900 p-4 sm:p-8 print:p-0">
            <Head title={t('print_catalog')} />

            {/* Print Toolbar (hidden on print) */}
            <div className="no-print max-w-5xl mx-auto mb-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/admin/products" className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50">
                        ← {t('back')}
                    </Link>
                    <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {['catalog', 'price_list', 'stock_report', 'labels'].map((tpl) => (
                            <button
                                key={tpl}
                                onClick={() => setTemplate(tpl)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    template === tpl ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {t(`tpl_${tpl}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                    <Printer className="w-4 h-4" />
                    <span>{t('print')}</span>
                </button>
            </div>

            {/* Printable Sheet */}
            <div className="max-w-5xl mx-auto bg-white rounded-2xl print:rounded-none border border-slate-200 print:border-none p-8 sm:p-10 shadow-sm print:shadow-none">
                <div className="mb-8 flex items-center justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <h1 className="text-2xl font-extrabold">{localized(settings.site_name, settings.site_name_ar) || 'Sannafly'}</h1>
                        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mt-0.5">{t(`tpl_${template}`)}</p>
                    </div>
                    <div className="text-end text-xs text-slate-500">
                        <div>{new Date().toLocaleDateString()}</div>
                        <div>{products.length} {t('products')}</div>
                    </div>
                </div>

                {template === 'labels' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {products.map((p) => (
                            <div key={p.id} className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center break-inside-avoid">
                                <div className="font-bold text-sm truncate">{localized(p.name, p.name_ar)}</div>
                                <div className="font-mono text-xs text-slate-500 mt-1">{p.sku}</div>
                                {p.barcode && (
                                    <div className="mt-2 py-1 px-2 bg-slate-50 border rounded font-mono text-xs tracking-widest">
                                        *{p.barcode}*
                                    </div>
                                )}
                                <div className="font-extrabold text-lg text-teal-800 mt-2">{formatPrice(p.prices?.[0]?.amount ?? '0')}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200 text-xs uppercase text-slate-500 bg-slate-50 print:bg-transparent">
                                {template === 'catalog' && <th className="py-2.5 px-2 text-start w-14"></th>}
                                <th className="py-2.5 px-2 text-start">{t('sku')}</th>
                                <th className="py-2.5 px-2 text-start">{t('products')}</th>
                                <th className="py-2.5 px-2 text-start">{t('categories')}</th>
                                {template === 'stock_report' && <th className="py-2.5 px-2 text-end">{t('stock')}</th>}
                                <th className="py-2.5 px-2 text-end">{t('price')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {products.map((p) => (
                                <tr key={p.id} className="break-inside-avoid">
                                    {template === 'catalog' && (
                                        <td className="py-2.5 px-2">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 border overflow-hidden flex items-center justify-center">
                                                {p.images?.[0] ? (
                                                    <img src={`/storage/${p.images[0].thumbnail_path || p.images[0].path}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-4 h-4 text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-2.5 px-2 font-mono text-xs text-slate-500">{p.sku}</td>
                                    <td className="py-2.5 px-2 font-semibold">{localized(p.name, p.name_ar)}</td>
                                    <td className="py-2.5 px-2 text-slate-600">{localized(p.category?.name, p.category?.name_ar) || '—'}</td>
                                    {template === 'stock_report' && (
                                        <td className={`py-2.5 px-2 text-end font-bold ${p.stock_quantity <= p.low_stock_threshold ? 'text-red-600' : ''}`}>
                                            {p.stock_quantity}
                                        </td>
                                    )}
                                    <td className="py-2.5 px-2 text-end font-bold text-teal-800">{formatPrice(p.prices?.[0]?.amount ?? '0')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
