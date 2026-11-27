import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Check, Download, Palette, Plus, Trash2, Upload } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface Preset {
    id: number;
    slug: string;
    name: string;
    name_ar: string | null;
    category: string;
    description: string | null;
    config: Record<string, any>;
    is_system: boolean;
}

export default function ThemePresetsPage({ presets }: { presets: Preset[] }) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [name, setName] = useState('');
    const [importJson, setImportJson] = useState('');

    const saveCurrent = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/customizer/themes', { name }, {
            preserveScroll: true,
            onSuccess: () => setName(''),
        });
    };

    const importPreset = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/customizer/themes/import', { theme_json: importJson }, {
            preserveScroll: true,
            onSuccess: () => setImportJson(''),
        });
    };

    return (
        <AdminLayout title={isAr ? 'قوالب الثيم الجاهزة' : 'Theme Presets'}>
            <Head title={isAr ? 'قوالب الثيم الجاهزة' : 'Theme Presets'} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Palette className="w-6 h-6 text-teal-600" />
                        {isAr ? 'مكتبة قوالب الثيم (Theme Presets)' : 'Theme Presets Library'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {isAr
                            ? 'تطبيق أي قالب يغيّر الألوان والتخطيط فقط دون المساس بالمنتجات أو الطلبات أو إعدادات الدفع والأمان.'
                            : 'Applying a preset updates visual theme settings only — products, orders, payments, security, and license are preserved.'}
                    </p>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presets.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-sm">{isAr ? p.name_ar || p.name : p.name}</span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] uppercase">{p.category}</span>
                                </div>
                                <p className="text-xs text-slate-500">{p.description}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.config.primary_color }} title="Primary" />
                                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: p.config.accent_color }} title="Accent" />
                                    <span className="text-[11px] text-slate-400 font-mono">{p.config.image_ratio} • {p.config.product_grid_columns} cols</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/customizer/themes/${p.id}/apply`, {}, { preserveScroll: true })}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {isAr ? 'تطبيق' : 'Apply'}
                                </button>
                                <a
                                    href={`/admin/customizer/themes/${p.id}/export`}
                                    className="p-2 rounded-xl border hover:bg-slate-50"
                                    title="Export JSON"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                                {!p.is_system && (
                                    <button
                                        type="button"
                                        onClick={() => router.delete(`/admin/customizer/themes/${p.id}`, { preserveScroll: true })}
                                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Current & Import JSON */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <form onSubmit={saveCurrent} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <h2 className="text-sm font-bold flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-teal-600" />
                            {isAr ? 'حفظ الثيم الحالي كقالب جديد' : 'Save Current Theme as Preset'}
                        </h2>
                        <input
                            type="text"
                            required
                            placeholder={isAr ? 'اسم القالب...' : 'Preset name...'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border text-sm"
                        />
                        <button type="submit" className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800">
                            {isAr ? 'حفظ القالب' : 'Save Preset'}
                        </button>
                    </form>

                    <form onSubmit={importPreset} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <h2 className="text-sm font-bold flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-teal-600" />
                            {isAr ? 'استيراد قالب JSON' : 'Import Theme JSON'}
                        </h2>
                        <textarea
                            rows={3}
                            required
                            placeholder='{"name":"My Theme","config":{"primary_color":"#0A5C57"}}'
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono"
                        />
                        <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">
                            {isAr ? 'استيراد وتأكيد الأمان' : 'Validate & Import'}
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
