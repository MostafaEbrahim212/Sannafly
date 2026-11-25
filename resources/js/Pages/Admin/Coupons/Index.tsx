import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Percent, Plus, Tag, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function CouponsIndex({ coupons }: { coupons: any }) {
    const { locale, formatPrice } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const form = useForm({
        code: '',
        name: '',
        type: 'percent' as 'percent' | 'fixed',
        value: '10',
        min_order_amount: '0',
        max_discount_amount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/coupons', {
            onSuccess: () => {
                setShowModal(false);
                form.reset();
            },
        });
    };

    return (
        <AdminLayout title={locale === 'ar' ? 'الكوبونات والخصومات' : 'Coupons & Promo Codes'}>
            <Head title="Coupons" />

            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500">
                    {locale === 'ar' ? 'إدارة أكواد الخصم والعروض الترويجية' : 'Create and manage discount promo codes'}
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة كوبون' : 'New Coupon'}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'الكود' : 'Code'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'القيمة' : 'Discount'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'الحد الأدنى' : 'Min Order'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'الاستخدام' : 'Usage'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="p-3.5 text-end">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {coupons.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-400">
                                    {locale === 'ar' ? 'لا توجد كوبونات بعد' : 'No coupons yet.'}
                                </td>
                            </tr>
                        ) : (
                            coupons.data.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50/70">
                                    <td className="p-3.5">
                                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                                            <Tag className="w-3.5 h-3.5" />
                                            {c.code}
                                        </span>
                                        {c.name && <div className="text-xs text-slate-500 mt-0.5">{c.name}</div>}
                                    </td>
                                    <td className="p-3.5 font-semibold">
                                        {c.type === 'percent' ? `${parseFloat(c.value)}%` : formatPrice(c.value)}
                                        {c.max_discount_amount && (
                                            <div className="text-[11px] text-slate-400">Max: {formatPrice(c.max_discount_amount)}</div>
                                        )}
                                    </td>
                                    <td className="p-3.5 text-xs">{formatPrice(c.min_order_amount || 0)}</td>
                                    <td className="p-3.5 text-xs">
                                        {c.used_count} / {c.usage_limit ?? '∞'}
                                    </td>
                                    <td className="p-3.5">
                                        <button
                                            onClick={() =>
                                                router.put(`/admin/coupons/${c.id}`, { ...c, is_active: !c.is_active }, { preserveScroll: true })
                                            }
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {c.is_active ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Inactive')}
                                        </button>
                                    </td>
                                    <td className="p-3.5 text-end">
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this coupon?')) router.delete(`/admin/coupons/${c.id}`);
                                            }}
                                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Percent className="w-5 h-5 text-teal-700" />
                            <span>{locale === 'ar' ? 'كوبون خصم جديد' : 'Create Coupon'}</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                    placeholder="SAVE20"
                                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Type</label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) => form.setData('type', e.target.value as 'percent' | 'fixed')}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                >
                                    <option value="percent">Percent (%)</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Value *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={form.data.value}
                                    onChange={(e) => form.setData('value', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Min Order</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.data.min_order_amount}
                                    onChange={(e) => form.setData('min_order_amount', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Max Discount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.data.max_discount_amount}
                                    onChange={(e) => form.setData('max_discount_amount', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Usage Limit</label>
                                <input
                                    type="number"
                                    value={form.data.usage_limit}
                                    onChange={(e) => form.setData('usage_limit', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">Expires At</label>
                            <input
                                type="date"
                                value={form.data.expires_at}
                                onChange={(e) => form.setData('expires_at', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold">
                                Save Coupon
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
