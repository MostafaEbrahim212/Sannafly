import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Play, Upload } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface PreviewData {
    file_path: string;
    filename: string;
    format: string;
    total_rows: number;
    headers: string[];
    sample_rows: any[][];
    suggested_mapping: Record<number, string>;
}

export default function ImportExportIndex({
    jobs,
    categories = [],
    systemFields = {},
}: {
    jobs: any[];
    categories: any[];
    systemFields: Record<string, string>;
}) {
    const { t, locale, localized } = useTranslation();

    // Import Wizard State
    const [uploading, setUploading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [mapping, setMapping] = useState<Record<number, string>>({});
    const [dupStrategy, setDupStrategy] = useState<'update' | 'skip' | 'fail'>('update');
    const [importing, setImporting] = useState(false);

    // Export Filter State
    const [exportStatus, setExportStatus] = useState('');
    const [exportCategory, setExportCategory] = useState('');

    // Job Error Drawer
    const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

    const handleFileSelect = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        setPreviewError(null);
        try {
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('/admin/import-export/preview', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
                body: fd,
            });
            const json = await res.json();
            if (!res.ok) {
                setPreviewError(json.message || 'Failed to parse file.');
            } else {
                setPreview(json);
                setMapping(json.suggested_mapping || {});
            }
        } catch {
            setPreviewError('Network error while reading file.');
        } finally {
            setUploading(false);
        }
    };

    const runImport = () => {
        if (!preview) return;
        setImporting(true);
        router.post(
            '/admin/import-export/import',
            {
                file_path: preview.file_path,
                filename: preview.filename,
                format: preview.format,
                column_mapping: mapping,
                duplicate_strategy: dupStrategy,
            },
            {
                onFinish: () => {
                    setImporting(false);
                    setPreview(null);
                },
            }
        );
    };

    const buildExportUrl = (format: 'csv' | 'xlsx') => {
        const params = new URLSearchParams({ format });
        if (exportStatus) params.set('status', exportStatus);
        if (exportCategory) params.set('category_id', exportCategory);
        return `/admin/import-export/export?${params.toString()}`;
    };

    return (
        <AdminLayout title={t('import_export')}>
            <Head title={t('import_export')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Left: 3-Step Import Wizard (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-bold text-base flex items-center gap-2">
                            <Upload className="w-5 h-5 text-teal-700" />
                            <span>{t('import_products_title')}</span>
                        </h2>
                        <div className="flex gap-3 text-xs">
                            <a href="/admin/import-export/template/csv" className="font-semibold text-teal-700 hover:underline">
                                {t('download_csv_template')}
                            </a>
                            <a href="/admin/import-export/template/xlsx" className="font-semibold text-indigo-600 hover:underline">
                                {t('download_xlsx_template')}
                            </a>
                        </div>
                    </div>

                    {!preview ? (
                        <div className="space-y-3">
                            <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors text-center">
                                <Upload className="w-8 h-8 text-teal-700" />
                                <span className="text-sm font-semibold text-slate-700">
                                    {uploading
                                        ? locale === 'ar' ? 'جارٍ تحليل الملف...' : 'Analyzing file...'
                                        : locale === 'ar'
                                        ? 'اختر ملف CSV أو Excel (.xlsx) للمعاينة وربط الأعمدة'
                                        : 'Drop or select a CSV / Excel (.xlsx) file to preview & map columns'}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {locale === 'ar'
                                        ? 'يدعم كل تفاصيل المنتج: الأسعار المتعددة، الأقسام، العلامات التجارية، المتغيرات، والـ SEO'
                                        : 'Supports full product details: multi-pricing, categories, brands, variations, tags & SEO'}
                                </span>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.txt"
                                    disabled={uploading}
                                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                            {previewError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                    {previewError}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 font-bold text-teal-900">
                                    <CheckCircle2 className="w-4 h-4 text-teal-700" />
                                    <span>{preview.filename} ({preview.total_rows} {locale === 'ar' ? 'صف' : 'rows'})</span>
                                </div>
                                <button type="button" onClick={() => setPreview(null)} className="text-rose-600 font-semibold hover:underline">
                                    {locale === 'ar' ? 'تغيير الملف' : 'Change file'}
                                </button>
                            </div>

                            {/* Column Mapping Table */}
                            <div className="max-h-72 overflow-y-auto border rounded-xl">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500 uppercase border-b sticky top-0">
                                        <tr>
                                            <th className="p-2.5 text-start">{locale === 'ar' ? 'عمود الملف' : 'File Column'}</th>
                                            <th className="p-2.5 text-start">{locale === 'ar' ? 'عينة بيانات' : 'Sample Value'}</th>
                                            <th className="p-2.5 text-start">{locale === 'ar' ? 'ربط بحقل النظام' : 'Map to Field'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {preview.headers.map((header, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2.5 font-mono font-semibold">{header}</td>
                                                <td className="p-2.5 text-slate-500 truncate max-w-[160px]">
                                                    {preview.sample_rows[0]?.[idx] ?? '—'}
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        value={mapping[idx] || ''}
                                                        onChange={(e) => setMapping({ ...mapping, [idx]: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                                                    >
                                                        <option value="">{locale === 'ar' ? '— تجاهل —' : '— Ignore —'}</option>
                                                        {Object.entries(systemFields).map(([key, label]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{t('duplicate_strategy')}:</span>
                                    <select
                                        value={dupStrategy}
                                        onChange={(e) => setDupStrategy(e.target.value as any)}
                                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                                    >
                                        <option value="update">{t('dup_update')}</option>
                                        <option value="skip">{t('dup_skip')}</option>
                                        <option value="fail">{t('dup_fail')}</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    disabled={importing}
                                    onClick={runImport}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>{importing ? '...' : t('run_import')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Filtered Full Export (5 cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                        <h2 className="font-bold text-base flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                            <span>{t('export_catalog')}</span>
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {locale === 'ar'
                                ? 'تصدير شامل لكل تفاصيل المنتجات (الأسعار، الأقسام، العلامات التجارية، المتغيرات، الوسوم، والـ SEO) مع حماية كاملة لملفات Excel.'
                                : 'Export complete product records (multi-pricing, categories, brands, variations, tags, SEO) with formula-injection protection.'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t('status')}</label>
                                <select
                                    value={exportStatus}
                                    onChange={(e) => setExportStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                                >
                                    <option value="">{t('all_statuses')}</option>
                                    <option value="published">{t('published')}</option>
                                    <option value="draft">{t('draft')}</option>
                                    <option value="archived">{t('archived')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t('categories')}</label>
                                <select
                                    value={exportCategory}
                                    onChange={(e) => setExportCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                                >
                                    <option value="">{t('all_categories')}</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{localized(c.name, c.name_ar)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                        <a
                            href={buildExportUrl('csv')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold hover:bg-slate-100"
                        >
                            <Download className="w-4 h-4 text-teal-700" />
                            <span>{t('export_csv')}</span>
                        </a>
                        <a
                            href={buildExportUrl('xlsx')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>{t('export_xlsx')}</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Import History & Error Reports */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{t('file')}</th>
                            <th className="p-3.5 text-start">{t('status')}</th>
                            <th className="p-3.5 text-start">{t('created')}</th>
                            <th className="p-3.5 text-start">{t('updated')}</th>
                            <th className="p-3.5 text-start">{t('failed')}</th>
                            <th className="p-3.5 text-end">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {jobs.map((j) => (
                            <React.Fragment key={j.id}>
                                <tr className="hover:bg-slate-50/60">
                                    <td className="p-3.5 font-semibold">{j.filename}</td>
                                    <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-semibold">{j.status}</span></td>
                                    <td className="p-3.5 text-emerald-700 font-bold">{j.created_rows}</td>
                                    <td className="p-3.5 text-teal-700 font-bold">{j.updated_rows}</td>
                                    <td className="p-3.5 text-rose-600 font-bold">{j.failed_rows}</td>
                                    <td className="p-3.5 text-end space-x-2">
                                        {j.failed_rows > 0 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedJobId(expandedJobId === j.id ? null : j.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                                                >
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    <span>{locale === 'ar' ? 'عرض الأخطاء' : 'View Errors'}</span>
                                                </button>
                                                <a
                                                    href={`/admin/import-export/jobs/${j.id}/errors`}
                                                    className="text-xs font-semibold text-teal-700 hover:underline"
                                                >
                                                    CSV
                                                </a>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedJobId === j.id && j.errors?.length > 0 && (
                                    <tr>
                                        <td colSpan={6} className="bg-rose-50/50 p-4">
                                            <div className="space-y-1 text-xs text-rose-800 max-h-40 overflow-y-auto">
                                                {j.errors.map((err: any) => (
                                                    <div key={err.id}>
                                                        <strong>Row {err.row_number}</strong> {err.sku ? `(${err.sku})` : ''}: {err.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
