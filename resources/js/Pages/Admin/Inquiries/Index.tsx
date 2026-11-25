import React from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function InquiriesIndex({ inquiries }: { inquiries: any }) {
    const { t } = useTranslation();

    return (
        <AdminLayout title={t('inquiries')}>
            <Head title={t('inquiries')} />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{t('customer')}</th>
                            <th className="p-3.5 text-start">{t('products')}</th>
                            <th className="p-3.5 text-start">{t('message')}</th>
                            <th className="p-3.5 text-end">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inquiries.data.map((inq: any) => (
                            <tr key={inq.id} className="hover:bg-slate-50/60">
                                <td className="p-3.5">
                                    <div className="font-semibold">{inq.name}</div>
                                    <div className="text-xs text-slate-500">{inq.phone || inq.email}</div>
                                </td>
                                <td className="p-3.5 text-xs font-medium">{inq.product?.name || t('general')}</td>
                                <td className="p-3.5 text-xs max-w-md text-slate-600">{inq.message}</td>
                                <td className="p-3.5 text-end">
                                    <select
                                        value={inq.status}
                                        onChange={(e) => router.put(`/admin/inquiries/${inq.id}/status`, { status: e.target.value })}
                                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                                    >
                                        <option value="new">{t('inq_new')}</option>
                                        <option value="replied">{t('inq_replied')}</option>
                                        <option value="closed">{t('inq_closed')}</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
