import React from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, RefreshCw, Rocket } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface Props {
    updateInfo: {
        current_version: string;
        release_date: string;
        remote_configured: boolean;
        update_available: boolean;
        latest_version: string | null;
        notes: string | null;
        message: string;
    };
    history: Array<{
        id: number;
        from_version: string;
        to_version: string;
        status: string;
        backup_file: string | null;
        notes: string | null;
        created_at: string;
        executor?: { name: string } | null;
    }>;
}

export default function SystemUpdates({ updateInfo, history }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    return (
        <AdminLayout title={isAr ? 'التحديثات والإصدار' : 'System Updates'}>
            <Head title={isAr ? 'التحديثات والإصدار' : 'System Updates'} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Rocket className="w-6 h-6 text-teal-600" />
                            {isAr ? 'إدارة التحديثات' : 'System Updates'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            {isAr ? 'الإصدار الحالي:' : 'Current Version:'} <strong>v{updateInfo.current_version}</strong>
                            {updateInfo.release_date ? ` (${updateInfo.release_date})` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/admin/system/updates/check', {}, { preserveScroll: true })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {isAr ? 'فحص التحديثات' : 'Check for Updates'}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>{updateInfo.message}</span>
                    </div>
                    {updateInfo.update_available && updateInfo.remote_configured && (
                        <button
                            type="button"
                            onClick={() => confirm('Create pre-update backup and execute update?') && router.post('/admin/system/updates/execute')}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                        >
                            {isAr ? `تحديث إلى v${updateInfo.latest_version}` : `Install Update v${updateInfo.latest_version}`}
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <h2 className="text-sm font-bold">{isAr ? 'سجل التحديثات والفحوصات' : 'Update History'}</h2>
                    {history.length === 0 ? (
                        <p className="text-xs text-slate-500">{isAr ? 'لا يوجد سجل تحديثات بعد.' : 'No update checks recorded yet.'}</p>
                    ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                            {history.map((h) => (
                                <div key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div>
                                        <span className="font-mono font-bold">v{h.from_version} → v{h.to_version}</span>
                                        <span className="ms-2 px-2 py-0.5 rounded bg-slate-100 text-[11px]">{h.status}</span>
                                        {h.notes && <p className="text-slate-500 mt-0.5">{h.notes}</p>}
                                    </div>
                                    <span className="text-slate-400">{h.created_at.slice(0, 16).replace('T', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
