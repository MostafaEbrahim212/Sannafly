import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Download, FileArchive, FileCode2, ShieldCheck, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface ExportItem {
    id: number;
    filename: string;
    format: string;
    file_size: number;
    created_at: string;
}

interface Props {
    preview: Record<string, any>;
    exports: ExportItem[];
}

export default function SystemSupport({ preview, exports }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const generate = (format: 'json' | 'txt' | 'zip') => {
        router.post('/admin/system/support/generate', { format }, { preserveScroll: true });
    };

    return (
        <AdminLayout title={isAr ? 'تقرير الدعم الفني' : 'Support Diagnostics'}>
            <Head title={isAr ? 'تقرير الدعم الفني' : 'Support Diagnostics'} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FileCode2 className="w-6 h-6 text-teal-600" />
                            {isAr ? 'تصدير تشخيص الدعم الفني' : 'Support Diagnostic Export'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {isAr
                                ? 'يتم إخفاء كلمات المرور والمفاتيح والبيانات الشخصية تلقائيًا قبل التصدير.'
                                : 'Passwords, API secrets, APP_KEY, .env, and customer PII are automatically redacted.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => generate('json')} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800">
                            Generate JSON
                        </button>
                        <button type="button" onClick={() => generate('txt')} className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50">
                            Generate TXT
                        </button>
                        <button type="button" onClick={() => generate('zip')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">
                            <FileArchive className="w-3.5 h-3.5" />
                            Generate ZIP
                        </button>
                    </div>
                </div>

                {/* Export History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <h2 className="text-sm font-bold">{isAr ? 'سجل التقارير المُنشأة' : 'Export History'}</h2>
                    {exports.length === 0 ? (
                        <p className="text-xs text-slate-500">{isAr ? 'لم يتم إنشاء تقارير دعم بعد.' : 'No diagnostic exports generated yet.'}</p>
                    ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                            {exports.map((ex) => (
                                <div key={ex.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div>
                                        <span className="font-mono font-bold">{ex.filename}</span>
                                        <span className="ms-2 uppercase px-1.5 py-0.5 rounded bg-slate-100">{ex.format}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={`/admin/system/support/${ex.id}/download`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold hover:bg-slate-50">
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                        <button type="button" onClick={() => router.delete(`/admin/system/support/${ex.id}`, { preserveScroll: true })} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sanitized Preview */}
                <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 text-xs font-mono overflow-x-auto max-h-[420px]">
                    <div className="text-teal-400 font-bold mb-2">Sanitized Report Preview</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
                </div>
            </div>
        </AdminLayout>
    );
}
