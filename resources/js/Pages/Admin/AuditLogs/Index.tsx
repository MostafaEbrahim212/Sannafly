import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Activity, Download, Search } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function AuditLogsIndex({
    logs,
    eventTypes = [],
    filters = {},
}: {
    logs: any;
    eventTypes?: string[];
    filters?: Record<string, string>;
}) {
    const { t, locale } = useTranslation();
    const isAr = locale === 'ar';

    const [search, setSearch] = useState(filters.search || '');
    const [eventType, setEventType] = useState(filters.event_type || '');
    const [from, setFrom] = useState(filters.from || '');
    const [to, setTo] = useState(filters.to || '');

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/system/audit-logs', { search, event_type: eventType, from, to }, { preserveState: true, replace: true });
    };

    const exportUrl = `/admin/system/audit-logs/export?search=${encodeURIComponent(search)}&event_type=${encodeURIComponent(eventType)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    return (
        <AdminLayout title={t('audit_logs')}>
            <Head title={t('audit_logs')} />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal-600" />
                        {t('audit_logs')}
                    </h1>
                    <a
                        href={exportUrl}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {isAr ? 'تصدير CSV' : 'Export CSV'}
                    </a>
                </div>

                <form onSubmit={applyFilters} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    <div className="sm:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isAr ? 'بحث بالفاعل، الإجراء، أو Request ID...' : 'Search actor, action, or request_id...'}
                            className="w-full ps-9 pe-3 py-2 rounded-xl border text-xs"
                        />
                    </div>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="px-3 py-2 rounded-xl border text-xs">
                        <option value="">{isAr ? 'كل الأنواع' : 'All Event Types'}</option>
                        {eventTypes.map((et) => (
                            <option key={et} value={et}>{et}</option>
                        ))}
                    </select>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl border text-xs" />
                    <div className="flex gap-2">
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-xs" />
                        <button type="submit" className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold">
                            {isAr ? 'تصفية' : 'Filter'}
                        </button>
                    </div>
                </form>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{t('actor')}</th>
                                <th className="p-3.5 text-start">{t('action')}</th>
                                <th className="p-3.5 text-start">{t('resource')}</th>
                                <th className="p-3.5 text-start">{t('ip_address')}</th>
                                <th className="p-3.5 text-start">Request ID</th>
                                <th className="p-3.5 text-start">{t('timestamp')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.data.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/60">
                                    <td className="p-3.5 font-semibold">{log.actor_name}</td>
                                    <td className="p-3.5">
                                        <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-mono text-xs font-semibold">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-xs text-slate-600">{log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}</td>
                                    <td className="p-3.5 font-mono text-xs text-slate-500">{log.ip_address}</td>
                                    <td className="p-3.5 font-mono text-[11px] text-slate-400">{log.request_id || '—'}</td>
                                    <td className="p-3.5 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
