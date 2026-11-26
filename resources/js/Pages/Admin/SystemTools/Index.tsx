import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Archive,
    CheckCircle2,
    Database,
    Download,
    FolderSync,
    HardDrive,
    KeyRound,
    Layers,
    Power,
    RefreshCw,
    RotateCcw,
    Server,
    Trash2,
    Wrench,
    XCircle,
    Zap,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface Diagnostics {
    php_version: string;
    laravel_version: string;
    app_env: string;
    app_debug: boolean;
    app_url: string;
    db_driver: string;
    db_status: string;
    cache_driver: string;
    queue_driver: string;
    mail_driver: string;
    log_channel: string;
    storage_linked: boolean;
    maintenance_mode: boolean;
    disk_free_gb: number;
    disk_total_gb: number;
    zip_available: boolean;
    extensions: Record<string, boolean>;
    pending_jobs: number;
    failed_jobs: number;
}

interface BackupItem {
    name: string;
    size: number;
    size_human: string;
    created_at: string;
    type: 'database' | 'full';
}

interface Props {
    diagnostics: Diagnostics;
    backups: BackupItem[];
}

export default function SystemToolsIndex({ diagnostics, backups }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [busyAction, setBusyAction] = useState<string | null>(null);
    const [maintenanceSecret, setMaintenanceSecret] = useState('sannafly-bypass');

    const runAction = (action: string, extra: Record<string, unknown> = {}, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        setBusyAction(action);
        router.post(
            '/admin/system-tools/action',
            { action, ...extra },
            {
                preserveScroll: true,
                onFinish: () => setBusyAction(null),
            }
        );
    };

    const createBackup = (includeStorage: boolean) => {
        const key = includeStorage ? 'backup_full' : 'backup_db';
        setBusyAction(key);
        router.post(
            '/admin/system-tools/backup',
            { include_storage: includeStorage },
            {
                preserveScroll: true,
                onFinish: () => setBusyAction(null),
            }
        );
    };

    const deleteBackup = (file: string) => {
        const msg = isAr ? `حذف النسخة الاحتياطية ${file}؟` : `Delete backup ${file}?`;
        if (!confirm(msg)) return;
        router.delete('/admin/system-tools/backup', {
            data: { file },
            preserveScroll: true,
        });
    };

    const cacheActions = [
        {
            id: 'optimize_clear',
            label: isAr ? 'مسح كل الكاش (Optimize Clear)' : 'Clear All Caches',
            desc: isAr ? 'يمسح الكاش والإعدادات والروابط والفيوز دفعة واحدة' : 'Clears cache, config, routes, and compiled views',
            icon: Zap,
            style: 'bg-teal-700 text-white hover:bg-teal-800',
        },
        {
            id: 'cache_clear',
            label: isAr ? 'مسح كاش التطبيق' : 'Clear App Cache',
            desc: 'php artisan cache:clear',
            icon: RefreshCw,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
        {
            id: 'config_clear',
            label: isAr ? 'مسح كاش الإعدادات' : 'Clear Config Cache',
            desc: 'php artisan config:clear',
            icon: Layers,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
        {
            id: 'route_clear',
            label: isAr ? 'مسح كاش الروابط' : 'Clear Route Cache',
            desc: 'php artisan route:clear',
            icon: Activity,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
        {
            id: 'view_clear',
            label: isAr ? 'مسح كاش القوالب' : 'Clear View Cache',
            desc: 'php artisan view:clear',
            icon: RefreshCw,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
        {
            id: 'optimize',
            label: isAr ? 'تسريع الإنتاج (Optimize)' : 'Build Production Cache',
            desc: isAr ? 'تخزين الإعدادات والروابط لتسريع السيرفر الحي' : 'Caches config, routes, and views for production',
            icon: Server,
            style: 'bg-indigo-600 text-white hover:bg-indigo-700',
        },
        {
            id: 'storage_link',
            label: isAr ? 'ربط مجلد التخزين (Storage Link)' : 'Link Public Storage',
            desc: 'php artisan storage:link',
            icon: FolderSync,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
        {
            id: 'auth_clear_resets',
            label: isAr ? 'تنظيف رموز استعادة كلمة المرور' : 'Clear Expired Resets',
            desc: 'php artisan auth:clear-resets',
            icon: KeyRound,
            style: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
        },
    ];

    return (
        <AdminLayout title={isAr ? 'أدوات الصيانة والباك اب' : 'System Tools & Backups'}>
            <Head title={isAr ? 'أدوات الصيانة والباك اب' : 'System Tools & Backups'} />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-teal-600" />
                        {isAr ? 'أدوات الصيانة والنسخ الاحتياطي (System Tools)' : 'System Tools, Cache & Backups'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isAr
                            ? 'إدارة الكاش، النسخ الاحتياطي لقاعدة البيانات والملفات، وضع الصيانة، وفحص صحة السيرفر.'
                            : 'Manage framework caches, database & storage backups, queue jobs, maintenance mode, and health checks.'}
                    </p>
                </div>

                {/* Diagnostics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">PHP / Laravel</div>
                        <div className="text-sm font-bold mt-1">{diagnostics.php_version} / {diagnostics.laravel_version}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'البيئة' : 'Environment'}</div>
                        <div className="text-sm font-bold mt-1 uppercase flex items-center gap-1.5">
                            {diagnostics.app_env}
                            {diagnostics.app_debug && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">DEBUG</span>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'قاعدة البيانات' : 'Database'}</div>
                        <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
                            {diagnostics.db_status === 'ok' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span className="uppercase">{diagnostics.db_driver}</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'ربط التخزين' : 'Storage Link'}</div>
                        <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
                            {diagnostics.storage_linked ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    {isAr ? 'متصل' : 'Linked'}
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-amber-600" />
                                    {isAr ? 'غير مربوط' : 'Missing'}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'المساحة المتاحة' : 'Disk Free'}</div>
                        <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-slate-400" />
                            {diagnostics.disk_free_gb} / {diagnostics.disk_total_gb} GB
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'الطابور (Queue)' : 'Queue Jobs'}</div>
                        <div className="text-sm font-bold mt-1">
                            {diagnostics.pending_jobs} {isAr ? 'معلق' : 'pending'} /{' '}
                            <span className={diagnostics.failed_jobs > 0 ? 'text-rose-600' : ''}>
                                {diagnostics.failed_jobs} {isAr ? 'فاشل' : 'failed'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cache & Quick Ops */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                    <h2 className="text-base font-bold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-teal-600" />
                        {isAr ? 'أوامر الكاش والتسريع السريعة' : 'Cache & Optimization Actions'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {cacheActions.map((item) => {
                            const Icon = item.icon;
                            const isLoading = busyAction === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={busyAction !== null}
                                    onClick={() => runAction(item.id)}
                                    className={`text-start p-4 rounded-xl transition-all disabled:opacity-60 ${item.style}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold">{item.label}</span>
                                        <Icon className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                                    </div>
                                    <p className="text-xs opacity-75 mt-1">{item.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Backups Center */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <Database className="w-4 h-4 text-teal-600" />
                                {isAr ? 'النسخ الاحتياطي (Database & Storage Backups)' : 'Backup Center'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isAr
                                    ? 'إنشاء وتحميل نسخة احتياطية كاملة لقاعدة البيانات أو مع ملفات الصور المرفوعة.'
                                    : 'Create and download SQL database dumps or full ZIP archives including uploaded media.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={busyAction !== null}
                                onClick={() => createBackup(false)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-60"
                            >
                                <Database className="w-4 h-4" />
                                {busyAction === 'backup_db'
                                    ? isAr
                                        ? 'جاري الإنشاء...'
                                        : 'Creating...'
                                    : isAr
                                      ? 'نسخة قاعدة البيانات (.sql)'
                                      : 'Backup Database (.sql)'}
                            </button>

                            {diagnostics.zip_available && (
                                <button
                                    type="button"
                                    disabled={busyAction !== null}
                                    onClick={() => createBackup(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                                >
                                    <Archive className="w-4 h-4" />
                                    {busyAction === 'backup_full'
                                        ? isAr
                                            ? 'جاري الضغط...'
                                            : 'Archiving...'
                                        : isAr
                                          ? 'نسخة كاملة DB + صور (.zip)'
                                          : 'Full Backup DB + Media (.zip)'}
                                </button>
                            )}
                        </div>
                    </div>

                    {backups.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-500">
                            {isAr ? 'لا توجد نسخ احتياطية محفوظة حتى الآن.' : 'No backups created yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                                        <th className="py-2.5 text-start">{isAr ? 'اسم الملف' : 'File'}</th>
                                        <th className="py-2.5 text-start">{isAr ? 'النوع' : 'Type'}</th>
                                        <th className="py-2.5 text-start">{isAr ? 'الحجم' : 'Size'}</th>
                                        <th className="py-2.5 text-start">{isAr ? 'التاريخ' : 'Created'}</th>
                                        <th className="py-2.5 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {backups.map((b) => (
                                        <tr key={b.name}>
                                            <td className="py-2.5 font-mono text-xs font-semibold">{b.name}</td>
                                            <td className="py-2.5">
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800">
                                                    {b.type === 'full' ? 'Full ZIP' : 'SQL Dump'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-xs text-slate-500">{b.size_human}</td>
                                            <td className="py-2.5 text-xs text-slate-500">{b.created_at}</td>
                                            <td className="py-2.5 text-end">
                                                <div className="inline-flex items-center gap-2">
                                                    <a
                                                        href={`/admin/system-tools/backup/download?file=${encodeURIComponent(b.name)}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        {isAr ? 'تحميل' : 'Download'}
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteBackup(b.name)}
                                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                                        title={isAr ? 'حذف' : 'Delete'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Queue & Maintenance Mode + Extensions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Queue & Maintenance */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <Power className="w-4 h-4 text-teal-600" />
                                {isAr ? 'وضع الصيانة (Maintenance Mode)' : 'Maintenance Mode'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {isAr
                                    ? 'إيقاف الموقع مؤقتًا للزوار أثناء التحديثات مع رابط سري للمطورين.'
                                    : 'Temporarily put the storefront into maintenance mode with a secret bypass URL.'}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {!diagnostics.maintenance_mode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={maintenanceSecret}
                                            onChange={(e) => setMaintenanceSecret(e.target.value)}
                                            placeholder="bypass-secret"
                                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                runAction(
                                                    'maintenance_down',
                                                    { secret: maintenanceSecret },
                                                    isAr ? 'تفعيل وضع الصيانة الآن؟' : 'Enable maintenance mode?'
                                                )
                                            }
                                            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                                        >
                                            {isAr ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => runAction('maintenance_up')}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                                    >
                                        {isAr ? 'إعادة تشغيل الموقع (Live)' : 'Bring Application Back Online'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                            <h3 className="text-sm font-bold mb-2">
                                {isAr ? 'إدارة المهام الفاشلة (Failed Queue Jobs)' : 'Queue Maintenance'}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => runAction('queue_retry')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {isAr ? 'إعادة محاولة المهام الفاشلة' : 'Retry All Failed Jobs'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        runAction(
                                            'queue_flush',
                                            {},
                                            isAr ? 'حذف كل المهام الفاشلة؟' : 'Flush all failed jobs?'
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isAr ? 'حذف المهام الفاشلة' : 'Flush Failed Jobs'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Runtime & PHP Extensions */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <Server className="w-4 h-4 text-teal-600" />
                            {isAr ? 'إعدادات التشغيل وإضافات PHP' : 'Runtime Drivers & PHP Extensions'}
                        </h2>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">Cache:</span> <strong>{diagnostics.cache_driver}</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">Queue:</span> <strong>{diagnostics.queue_driver}</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">Mail:</span> <strong>{diagnostics.mail_driver}</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">Log Channel:</span> <strong>{diagnostics.log_channel}</strong>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {Object.entries(diagnostics.extensions).map(([ext, loaded]) => (
                                <span
                                    key={ext}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                                        loaded
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                >
                                    {loaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
