import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import type { Category } from '@/types';

export default function CategoriesIndex({ categories }: { categories: Category[] }) {
    const { t, localized } = useTranslation();
    const form = useForm({ name: '', name_ar: '', parent_id: '', is_visible: true, sort_order: 0 });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/categories', { onSuccess: () => form.reset() });
    };

    return (
        <AdminLayout title={t('categories')}>
            <Head title={t('categories')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={submit} className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 h-fit shadow-xs">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" />
                        <span>{t('add_category')}</span>
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
                    <select
                        value={form.data.parent_id}
                        onChange={(e) => form.setData('parent_id', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                        <option value="">{t('top_level_category')}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{localized(c.name, c.name_ar)}</option>
                        ))}
                    </select>
                    <button type="submit" disabled={form.processing} className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                        {t('create')}
                    </button>
                </form>

                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{t('name')}</th>
                                <th className="p-3.5 text-start">{t('parent')}</th>
                                <th className="p-3.5 text-start">{t('products')}</th>
                                <th className="p-3.5 text-end">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/60">
                                    <td className="p-3.5 font-semibold flex items-center gap-2.5">
                                        <FolderTree className="w-4 h-4 text-teal-600 shrink-0" />
                                        <span>{localized(c.name, c.name_ar)}</span>
                                    </td>
                                    <td className="p-3.5 text-slate-500 text-xs">{c.parent ? localized(c.parent.name, c.parent.name_ar) : '—'}</td>
                                    <td className="p-3.5">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold">{c.products_count ?? 0}</span>
                                    </td>
                                    <td className="p-3.5 text-end">
                                        <button onClick={() => router.delete(`/admin/categories/${c.id}`)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
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
