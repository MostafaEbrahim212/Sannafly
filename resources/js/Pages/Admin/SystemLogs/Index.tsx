import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Download,
    FileText,
    Info,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface LogFileItem {
    name: string;
    size: number;
    size_human: string;
    modified_at: string;
}

interface LogEntry {
    id: string;
    timestamp: string;
    env: string;
    level: string;
    message: string;
    context: string | null;
    trace: string | null;
}

interface Props {
    files: LogFileItem[];
    activeFile: string | null;
    entries: LogEntry[];
    counts: Record<string, number>;
    truncated: boolean;
    filters: {
        file: string;
        level: string;
        search: string;
    };
}

const LEVELS = ['ALL', 'EMERGENCY', 'CRITICAL', 'ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG'] as const;

const LEVEL_STYLES: Record<string, string> = {
    EMERGENCY: 'bg-rose-600 text-white border-rose-600',
    ALERT: 'bg-rose-600 text-white border-rose-600',
    CRITICAL: 'bg-red-600 text-white border-red-600',
    ERROR: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
    WARNING: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    NOTICE: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800',
    INFO: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    DEBUG: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export default function SystemLogsIndex({ files, activeFile, entries, counts, truncated, filters }: Props) {
    const { locale, can } = useTranslation();
    const isAr = locale === 'ar';

    const [search, setSearch] = useState(filters.search || '');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const navigate = (next: Partial<typeof filters>) => {
        router.get(
            '/admin/system-logs',
            {
                file: next.file ?? filters.file,
                level: next.level ?? filters.level,
                search: next.search ?? search,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate({ search });
    };

    const toggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyEntry = async (entry: LogEntry) => {
        const text = [
            `[${entry.timestamp}] ${entry.env}.${entry.level}: ${entry.message}`,
            entry.context ? `Context:\n${entry.context}` : '',
            entry.trace ? `Trace:\n${entry.trace}` : '',
        ]
            .filter(Boolean)
            .join('\n\n');

        await navigator.clipboard.writeText(text);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 1800);
    };

    const clearFile = () => {
        if (!activeFile) return;
        const msg = isAr ? `هل أنت متأكد من تفريغ الملف ${activeFile}؟` : `Clear all entries in ${activeFile}?`;
        if (!confirm(msg)) return;
        router.post('/admin/system-logs/clear', { file: activeFile }, { preserveScroll: true });
    };

    const deleteFile = () => {
        if (!activeFile) return;
        const msg = isAr ? `هل أنت متأكد من حذف الملف ${activeFile} نهائيًا؟` : `Permanently delete ${activeFile}?`;
        if (!confirm(msg)) return;
        router.delete('/admin/system-logs', { data: { file: activeFile } });
    };

    return (
        <AdminLayout title={isAr ? 'سجلات النظام (System Logs)' : 'System Logs'}>
            <Head title={isAr ? 'سجلات النظام' : 'System Logs'} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FileText className="w-6 h-6 text-teal-600" />
                            {isAr ? 'سجلات النظام الاحترافية' : 'System Logs Viewer'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isAr
                                ? 'عرض وتحليل ملفات السجلات (الأخطاء، المدفوعات، الأمان، والاستعلامات البطيئة) مع تصفية فورية.'
                                : 'Inspect structured application, payment, security, and slow-query logs in real time.'}
                        </p>
                    </div>

                    {activeFile && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate({})}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                {isAr ? 'تحديث' : 'Refresh'}
                            </button>
                            <a
                                href={`/admin/system-logs/download?file=${encodeURIComponent(activeFile)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <Download className="w-3.5 h-3.5" />
                                {isAr ? 'تحميل الملف' : 'Download'}
                            </a>
                            {can('settings.manage') && (
                                <>
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                    >
                                        {isAr ? 'تفريغ السجل' : 'Clear Log'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deleteFile}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {isAr ? 'حذف' : 'Delete'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Files & Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Log Files Sidebar */}
                    <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 h-fit">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
                            {isAr ? 'ملفات السجلات' : 'Log Files'} ({files.length})
                        </h2>
                        {files.length === 0 ? (
                            <p className="text-xs text-slate-500 px-2 py-4">
                                {isAr ? 'لا توجد ملفات سجلات حاليًا.' : 'No log files found.'}
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-[480px] overflow-y-auto">
                                {files.map((file) => {
                                    const active = file.name === activeFile;
                                    return (
                                        <button
                                            key={file.name}
                                            type="button"
                                            onClick={() => navigate({ file: file.name, level: 'ALL' })}
                                            className={`w-full text-start px-3 py-2.5 rounded-xl border transition-colors ${
                                                active
                                                    ? 'bg-teal-50 border-teal-300 text-teal-900 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-200'
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold truncate">{file.name}</div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                                <span>{file.size_human}</span>
                                                <span>{file.modified_at.slice(0, 16)}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Main Viewer */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Level Tabs + Search */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                            <div className="flex flex-wrap gap-1.5">
                                {LEVELS.map((lvl) => {
                                    const count = counts[lvl] ?? 0;
                                    const isSelected = (filters.level || 'ALL') === lvl;
                                    if (lvl !== 'ALL' && count === 0 && !isSelected) return null;
                                    return (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => navigate({ level: lvl })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-teal-600 dark:border-teal-600'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                            }`}
                                        >
                                            {lvl} <span className="opacity-75">({count})</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={
                                            isAr
                                                ? 'ابحث بالرسالة، Request ID، رقم الطلب، أو المسار...'
                                                : 'Search message, request_id, user_id, path, or trace...'
                                        }
                                        className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                                >
                                    {isAr ? 'بحث' : 'Filter'}
                                </button>
                            </form>

                            {truncated && (
                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800 rounded-xl px-3 py-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>
                                        {isAr
                                            ? 'حجم الملف كبير؛ يتم عرض أحدث 2 ميجابايت فقط. يمكنك تحميل الملف كاملًا من الأعلى.'
                                            : 'Large log file: showing the latest 2 MB tail. Use Download for the full file.'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Entries List */}
                        <div className="space-y-2.5">
                            {entries.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
                                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    {isAr ? 'لا توجد سجلات مطابقة للفلتر الحالي.' : 'No log entries match the current filters.'}
                                </div>
                            ) : (
                                entries.map((entry) => {
                                    const isOpen = !!expanded[entry.id];
                                    const hasDetails = Boolean(entry.context || entry.trace);
                                    const badgeCls = LEVEL_STYLES[entry.level] || LEVEL_STYLES.DEBUG;
                                    return (
                                        <div
                                            key={entry.id}
                                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                                        >
                                            <div className="p-4 flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeCls}`}>
                                                            {entry.level}
                                                        </span>
                                                        <span className="text-xs font-mono text-slate-500">{entry.timestamp}</span>
                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                                            {entry.env}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                                                        {entry.message}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyEntry(entry)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        title={isAr ? 'نسخ' : 'Copy'}
                                                    >
                                                        {copiedId === entry.id ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {hasDetails && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(entry.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        >
                                                            {isOpen ? (
                                                                <>
                                                                    {isAr ? 'إخفاء' : 'Hide'} <ChevronUp className="w-3.5 h-3.5" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {isAr ? 'التفاصيل' : 'Details'} <ChevronDown className="w-3.5 h-3.5" />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {isOpen && hasDetails && (
                                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 space-y-3 text-xs font-mono overflow-x-auto">
                                                    {entry.context && (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wider text-teal-400 mb-1 flex items-center gap-1">
                                                                <ShieldAlert className="w-3.5 h-3.5" /> Context
                                                            </div>
                                                            <pre className="whitespace-pre-wrap break-all leading-relaxed">{entry.context}</pre>
                                                        </div>
                                                    )}
                                                    {entry.trace && (
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wider text-amber-400 mb-1">
                                                                Stack Trace
                                                            </div>
                                                            <pre className="whitespace-pre-wrap break-all leading-relaxed text-slate-300">
                                                                {entry.trace}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
