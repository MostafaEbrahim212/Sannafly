import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Boxes } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function InventoryIndex({ products, movements }: { products: any; movements: any[] }) {
    const { t, can, localized } = useTranslation();
    const [deltas, setDeltas] = useState<Record<number, string>>({});

    const adjust = (productId: number) => {
        const val = parseInt(deltas[productId] || '0', 10);
        if (!val) return;
        router.post(`/admin/inventory/${productId}/adjust`, { quantity_change: val }, {
            onSuccess: () => setDeltas((prev) => ({ ...prev, [productId]: '' })),
        });
    };

    return (
        <AdminLayout title={t('inventory')}>
            <Head title={t('inventory')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{t('products')}</th>
                                <th className="p-3.5 text-start">{t('sku')}</th>
                                <th className="p-3.5 text-start">{t('stock')}</th>
                                {can('inventory.manage') && <th className="p-3.5 text-end">{t('adjust_stock')}</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.data.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/60">
                                    <td className="p-3.5 font-semibold">{localized(p.name, p.name_ar)}</td>
                                    <td className="p-3.5 font-mono text-xs text-slate-500">{p.sku}</td>
                                    <td className="p-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${p.stock_quantity <= p.low_stock_threshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {p.stock_quantity}
                                        </span>
                                    </td>
                                    {can('inventory.manage') && (
                                        <td className="p-3.5 text-end">
                                            <div className="inline-flex gap-1.5">
                                                <input
                                                    type="number"
                                                    placeholder="+10 / -5"
                                                    value={deltas[p.id] || ''}
                                                    onChange={(e) => setDeltas((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                                    className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs"
                                                />
                                                <button onClick={() => adjust(p.id)} className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                                                    {t('apply')}
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs h-fit">
                    <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
                        <Boxes className="w-4 h-4 text-teal-600" />
                        <span>{t('recent_stock_movements')}</span>
                    </h2>
                    <div className="space-y-3 text-xs">
                        {movements.map((m) => (
                            <div key={m.id} className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{m.product?.name}</div>
                                    <div className="text-slate-500">{m.type} • {m.reason}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full font-bold ${m.quantity_change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {m.quantity_change >= 0 ? `+${m.quantity_change}` : m.quantity_change}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
