import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import type { Brand } from '@/types';

export default function BrandsIndex({ brands }: { brands: Brand[] }) {
    const { t, localized } = useTranslation();
    const form = useForm({ name: '', name_ar: '', website: '', is_visible: true });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/brands', { onSuccess: () => form.reset() });
    };

    return (
        <AdminLayout title={t('brands')}>
            <Head title={t('brands')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={submit} className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 h-fit shadow-xs">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" />
                        <span>{t('add_brand')}</span>
                    </h2>
                    <input
                        type="text"
                        placeholder="Name (EN)"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        required
                    />
                    <input
                        type="text"
                        dir="rtl"
                        placeholder="الاسم (عربي)"
                        value={form.data.name_ar}
                        onChange={(e) => form.setData('name_ar', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                    <input
                        type="url"
                        placeholder="https://..."
                        value={form.data.website}
                        onChange={(e) => form.setData('website', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                    <button type="submit" disabled={form.processing} className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                        {t('create')}
                    </button>
                </form>

                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{t('name')}</th>
                                <th className="p-3.5 text-start">{t('products')}</th>
                                <th className="p-3.5 text-end">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {brands.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/60">
                                    <td className="p-3.5 font-semibold flex items-center gap-2.5">
                                        <Tag className="w-4 h-4 text-teal-600 shrink-0" />
                                        <span>{localized(b.name, b.name_ar)}</span>
                                    </td>
                                    <td className="p-3.5">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold">{b.products_count ?? 0}</span>
                                    </td>
                                    <td className="p-3.5 text-end">
                                        <button onClick={() => router.delete(`/admin/brands/${b.id}`)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
