import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function AuditLogsIndex({ logs }: { logs: any }) {
    const { t } = useTranslation();

    return (
        <AdminLayout title={t('audit_logs')}>
            <Head title={t('audit_logs')} />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{t('actor')}</th>
                            <th className="p-3.5 text-start">{t('action')}</th>
                            <th className="p-3.5 text-start">{t('resource')}</th>
                            <th className="p-3.5 text-start">{t('ip_address')}</th>
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
                                <td className="p-3.5 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
