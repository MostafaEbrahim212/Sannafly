import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Sliders, X } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function AttributesIndex({ attributes }: { attributes: any[] }) {
    const { t } = useTranslation();
    const form = useForm({ name: '', name_ar: '', type: 'select' });
    const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

    const submitAttr = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/attributes', { onSuccess: () => form.reset() });
    };

    const addOption = (attrId: number) => {
        const value = (optionInputs[attrId] || '').trim();
        if (!value) return;
        router.post(`/admin/attributes/${attrId}/options`, { value }, {
            onSuccess: () => setOptionInputs((prev) => ({ ...prev, [attrId]: '' })),
        });
    };

    return (
        <AdminLayout title={t('attributes')}>
            <Head title={t('attributes')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={submitAttr} className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 h-fit shadow-xs">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-600" />
                        <span>{t('new_attribute')}</span>
                    </h2>
                    <input
                        type="text"
                        placeholder={t('attribute_name_placeholder')}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        required
                    />
                    <select
                        value={form.data.type}
                        onChange={(e) => form.setData('type', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                        <option value="select">{t('attr_select')}</option>
                        <option value="color">{t('attr_color')}</option>
                        <option value="text">{t('attr_text')}</option>
                    </select>
                    <button type="submit" disabled={form.processing} className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                        {t('create')}
                    </button>
                </form>

                <div className="lg:col-span-8 space-y-4">
                    {attributes.map((attr) => (
                        <div key={attr.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-bold text-sm flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-teal-600" />
                                    <span>{attr.name}</span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                    {t(`attr_${attr.type}`, attr.type)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {attr.options?.map((opt: any) => (
                                    <span key={opt.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium">
                                        {opt.value}
                                        <button
                                            onClick={() => router.delete(`/admin/attribute-options/${opt.id}`)}
                                            className="text-slate-400 hover:text-red-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('add_option_placeholder')}
                                    value={optionInputs[attr.id] || ''}
                                    onChange={(e) => setOptionInputs((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption(attr.id))}
                                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs flex-1"
                                />
                                <button onClick={() => addOption(attr.id)} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
                                    {t('add')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
