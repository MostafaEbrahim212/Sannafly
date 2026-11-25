import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Plus, Printer, Search, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import type { Brand, Category, Product } from '@/types';

interface ProductsIndexProps {
    products: {
        data: Product[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    categories: Category[];
    brands: Brand[];
    filters: Record<string, any>;
}

export default function ProductsIndex({ products, categories, brands, filters }: ProductsIndexProps) {
    const { t, localized, formatPrice, can, locale } = useTranslation();
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    const applyFilter = (overrides: Record<string, any> = {}) => {
        router.get('/admin/products', { search, status, category_id: categoryId, ...overrides }, { preserveState: true });
    };

    const toggleAll = (checked: boolean) => {
        setSelected(checked ? products.data.map((p) => p.id) : []);
    };

    const toggleOne = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const runBulk = (action: string, extra: Record<string, any> = {}) => {
        if (selected.length === 0) return;
        if (action === 'delete' && !confirm(`Delete ${selected.length} selected products?`)) return;
        router.post('/admin/products/bulk', { action, ids: selected, ...extra }, {
            onSuccess: () => {
                setSelected([]);
                setBulkPrice('');
                setBulkStock('');
            },
        });
    };

    return (
        <AdminLayout title={t('products')}>
            <Head title={t('products')} />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            placeholder={t('search_placeholder')}
                            className="ps-3 pe-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-60"
                        />
                        <button onClick={() => applyFilter()} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilter({ status: e.target.value });
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                        <option value="">{t('all_statuses')}</option>
                        <option value="published">{t('published')}</option>
                        <option value="draft">{t('draft')}</option>
                        <option value="archived">{t('archived')}</option>
                    </select>
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            setCategoryId(e.target.value);
                            applyFilter({ category_id: e.target.value });
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                        <option value="">{t('all_categories')}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{localized(c.name, c.name_ar)}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {can('products.print') && (
                        <Link
                            href={`/admin/print/catalog${selected.length ? `?ids=${selected.join(',')}` : ''}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{t('print')}</span>
                        </Link>
                    )}
                    {can('products.export') && (
                        <a
                            href="/admin/import-export/export?format=csv"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
                        >
                            <Download className="w-4 h-4" />
                            <span>{t('export')}</span>
                        </a>
                    )}
                    {can('products.create') && (
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('create')}</span>
                        </Link>
                    )}
                </div>
            </div>

            {selected.length > 0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-teal-900">{selected.length} {t('selected')}</span>
                    <div className="flex flex-wrap items-center gap-2">
                        {can('products.publish') && (
                            <>
                                <button onClick={() => runBulk('publish')} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">{t('publish')}</button>
                                <button onClick={() => runBulk('draft')} className="px-3 py-1.5 rounded-xl bg-slate-600 text-white text-xs font-semibold">{t('set_draft')}</button>
                            </>
                        )}
                        {can('products.edit') && (
                            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200">
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder={locale === 'ar' ? 'سعر موحد' : 'Set Price'}
                                    value={bulkPrice}
                                    onChange={(e) => setBulkPrice(e.target.value)}
                                    className="w-24 px-2 py-1 text-xs rounded-lg border-0 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => bulkPrice !== '' && runBulk('update_price', { price_amount: parseFloat(bulkPrice) })}
                                    className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-xs font-semibold"
                                >
                                    {t('apply')}
                                </button>
                            </div>
                        )}
                        {can('inventory.manage') && (
                            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200">
                                <input
                                    type="number"
                                    placeholder={locale === 'ar' ? 'تعديل مخزون +/-' : 'Stock +/-'}
                                    value={bulkStock}
                                    onChange={(e) => setBulkStock(e.target.value)}
                                    className="w-24 px-2 py-1 text-xs rounded-lg border-0 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => bulkStock !== '' && runBulk('adjust_stock', { stock_delta: parseInt(bulkStock, 10) })}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-700 text-white text-xs font-semibold"
                                >
                                    {t('apply')}
                                </button>
                            </div>
                        )}
                        {can('products.delete') && (
                            <button onClick={() => runBulk('delete')} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold">{t('delete')}</button>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-sm text-start">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={selected.length > 0 && selected.length === products.data.length}
                                    onChange={(e) => toggleAll(e.target.checked)}
                                />
                            </th>
                            <th className="p-3 text-start">{t('name')}</th>
                            <th className="p-3 text-start">{t('sku')}</th>
                            <th className="p-3 text-start">{t('categories')}</th>
                            <th className="p-3 text-start">{t('price')}</th>
                            <th className="p-3 text-start">{t('stock')}</th>
                            <th className="p-3 text-start">{t('status')}</th>
                            <th className="p-3 text-end">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {products.data.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                <td className="p-3">
                                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} />
                                </td>
                                <td className="p-3 font-medium">
                                    <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 hover:text-teal-700">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0">
                                            {p.images?.[0] ? (
                                                <img
                                                    src={`/storage/${p.images[0].thumbnail_path || p.images[0].path}`}
                                                    alt=""
                                                    loading="lazy"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-mono">IMG</span>
                                            )}
                                        </div>
                                        <span>{localized(p.name, p.name_ar)}</span>
                                    </Link>
                                </td>
                                <td className="p-3 font-mono text-xs text-slate-500">{p.sku}</td>
                                <td className="p-3 text-slate-600">{localized(p.category?.name, p.category?.name_ar) || '—'}</td>
                                <td className="p-3 font-semibold">{formatPrice(p.prices?.[0]?.amount ?? '0')}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_quantity <= p.low_stock_threshold ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                        {p.stock_quantity}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-3 text-end space-x-2">
                                    {can('products.edit') && (
                                        <Link href={`/admin/products/${p.id}/edit`} className="text-teal-700 hover:underline text-xs font-medium">
                                            {t('edit')}
                                        </Link>
                                    )}
                                    {can('products.delete') && (
                                        <button
                                            onClick={() => confirm('Delete this product?') && router.delete(`/admin/products/${p.id}`)}
                                            className="text-red-600 hover:text-red-800 inline-flex items-center"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.links.length > 3 && (
                <div className="mt-6 flex flex-wrap gap-1 justify-end">
                    {products.links.map((link, idx) => (
                        <Link
                            key={idx}
                            href={link.url || '#'}
                            className={`px-3 py-1 rounded border text-xs ${link.active ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-slate-200'} ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
