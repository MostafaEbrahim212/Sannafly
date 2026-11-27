import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Archive, CheckCircle2, Database, Download, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface BackupRecord {
    id: number;
    name: string;
    type: string;
    file_size: number;
    checksum: string | null;
    integrity_status: string;
    status: string;
    product_version: string | null;
    created_at: string;
    creator?: { name: string } | null;
}

interface Props {
    backups: { data: BackupRecord[] };
    retentionCount: number;
}

export default function SystemBackups({ backups, retentionCount }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [keep, setKeep] = useState(retentionCount);
    const [busy, setBusy] = useState(false);

    const createBackup = (type: 'database' | 'full') => {
        setBusy(true);
        router.post('/admin/system/backups', { type }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const restore = (b: BackupRecord) => {
        const msg = isAr
            ? `تحذير: استعادة ${b.name} ستنشئ نسخة أمان قبل الاستعادة ثم تستعيد قاعدة البيانات. هل أنت متأكد؟`
            : `WARNING: Restoring ${b.name} will create a pre-restore safety snapshot and overwrite current tables. Continue?`;
        if (!confirm(msg)) return;
        router.post(`/admin/system/backups/${b.id}/restore`, {}, { preserveScroll: true });
    };

    const formatSize = (bytes: number) => (bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`);

    return (
        <AdminLayout title={isAr ? 'النسخ الاحتياطي والاستعادة' : 'Backups & Restore'}>
            <Head title={isAr ? 'النسخ الاحتياطي والاستعادة' : 'Backups & Restore'} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Database className="w-6 h-6 text-teal-600" />
                            {isAr ? 'إدارة النسخ الاحتياطي والاستعادة' : 'Backup & Restore Center'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            {isAr ? 'تُحفظ النسخ في مجلد خاص محمي مع بصمة SHA-256 للتحقق من السلامة.' : 'Stored privately outside public/ with SHA-256 checksum verification.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => createBackup('database')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                        >
                            <Database className="w-4 h-4" />
                            {isAr ? 'نسخة قاعدة البيانات (.sql)' : 'Database Backup (.sql)'}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => createBackup('full')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                        >
                            <Archive className="w-4 h-4" />
                            {isAr ? 'نسخة كاملة (.zip)' : 'Full Backup (.zip)'}
                        </button>
                    </div>
                </div>

                {/* Retention */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        {isAr ? 'سياسة الاحتفاظ: الاحتفاظ بأحدث' : 'Retention Policy: Keep latest'}{' '}
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={keep}
                            onChange={(e) => setKeep(Number(e.target.value) || 1)}
                            className="w-16 mx-1 px-2 py-1 rounded-lg border text-xs text-center"
                        />{' '}
                        {isAr ? 'نسخ' : 'backups'}
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/admin/system/backups/prune', { keep }, { preserveScroll: true })}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50"
                    >
                        {isAr ? 'تطبيق التنظيف' : 'Apply Retention Cleanup'}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{isAr ? 'الملف' : 'Backup Name'}</th>
                                <th className="p-3.5 text-start">{isAr ? 'النوع' : 'Type'}</th>
                                <th className="p-3.5 text-start">{isAr ? 'الحجم' : 'Size'}</th>
                                <th className="p-3.5 text-start">{isAr ? 'السلامة' : 'Integrity'}</th>
                                <th className="p-3.5 text-start">{isAr ? 'التاريخ' : 'Created'}</th>
                                <th className="p-3.5 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {backups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                                        {isAr ? 'لا توجد نسخ احتياطية بعد.' : 'No backups recorded yet.'}
                                    </td>
                                </tr>
                            ) : (
                                backups.data.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/60">
                                        <td className="p-3.5 font-mono text-xs font-semibold">
                                            <div>{b.name}</div>
                                            {b.checksum && <div className="text-[10px] text-slate-400">sha256: {b.checksum.slice(0, 16)}…</div>}
                                        </td>
                                        <td className="p-3.5 text-xs uppercase">{b.type}</td>
                                        <td className="p-3.5 text-xs">{formatSize(b.file_size)}</td>
                                        <td className="p-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${b.integrity_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                <CheckCircle2 className="w-3 h-3" />
                                                {b.integrity_status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-xs text-slate-500">{b.created_at.slice(0, 19).replace('T', ' ')}</td>
                                        <td className="p-3.5 text-end">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(`/admin/system/backups/${b.id}/verify`, {}, { preserveScroll: true })}
                                                    className="p-1.5 rounded-lg border text-xs hover:bg-slate-50"
                                                    title={isAr ? 'فحص السلامة' : 'Verify Checksum'}
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                                </button>
                                                <a
                                                    href={`/admin/system/backups/${b.id}/download`}
                                                    className="p-1.5 rounded-lg border text-xs hover:bg-slate-50"
                                                    title={isAr ? 'تحميل' : 'Download'}
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                                {b.type === 'database' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => restore(b)}
                                                        className="p-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50"
                                                        title={isAr ? 'استعادة' : 'Restore'}
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => confirm('Delete backup?') && router.delete(`/admin/system/backups/${b.id}`, { preserveScroll: true })}
                                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                                    title={isAr ? 'حذف' : 'Delete'}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
