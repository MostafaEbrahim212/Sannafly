import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Activity, AlertTriangle, CheckCircle2, Mail, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface HealthCheck {
    id: string;
    category: string;
    name: string;
    status: 'passed' | 'warning' | 'failed' | 'not_applicable';
    severity: string;
    description: string;
    result: string;
    suggested_action: string;
    execution_time_ms: number;
    last_checked: string;
}

interface Props {
    report: {
        overall_status: 'healthy' | 'warning' | 'critical';
        last_checked: string;
        version: string;
        environment: string;
        counts: { passed: number; warning: number; failed: number; not_applicable: number };
        checks: HealthCheck[];
    };
}

export default function SystemHealth({ report }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [filter, setFilter] = useState<'all' | 'passed' | 'warning' | 'failed'>('all');
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);

    const filteredChecks = report.checks.filter((c) => filter === 'all' || c.status === filter);

    const sendTestMail = (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        router.post('/admin/system/health/test-mail', { email: testEmail }, {
            preserveScroll: true,
            onFinish: () => setSending(false),
        });
    };

    const statusBadge =
        report.overall_status === 'healthy'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : report.overall_status === 'warning'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

    return (
        <AdminLayout title={isAr ? 'صحة النظام والتشخيص' : 'System Health & Diagnostics'}>
            <Head title={isAr ? 'صحة النظام والتشخيص' : 'System Health & Diagnostics'} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Activity className="w-6 h-6 text-teal-600" />
                            {isAr ? 'صحة النظام والتشخيص' : 'System Health & Diagnostics'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            v{report.version} • {report.environment.toUpperCase()} • {isAr ? 'آخر فحص:' : 'Last checked:'} {report.last_checked.slice(0, 19).replace('T', ' ')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase ${statusBadge}`}>
                            {report.overall_status}
                        </span>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isAr ? 'إعادة الفحص' : 'Run Checks'}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['all', 'passed', 'warning', 'failed'] as const).map((k) => {
                        const count = k === 'all' ? report.checks.length : report.counts[k];
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setFilter(k)}
                                className={`text-start p-4 rounded-2xl border transition-colors ${
                                    filter === k
                                        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/30'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div className="text-xs text-slate-500 uppercase font-semibold">{k}</div>
                                <div className="text-2xl font-extrabold mt-1">{count}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Checks List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {filteredChecks.map((check) => (
                        <div key={check.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                                {check.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                                {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
                                {check.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                                <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-sm">{check.name}</span>
                                        <span className="text-[11px] font-mono text-slate-400">{check.execution_time_ms} ms</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">{check.result}</p>
                                    {check.status !== 'passed' && (
                                        <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                            <span>{check.suggested_action}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Safe Mail Test */}
                <form onSubmit={sendTestMail} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-xs font-bold mb-1 flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-teal-600" />
                            {isAr ? 'إرسال بريد اختباري (Mail Health Test)' : 'Send Diagnostic Test Email'}
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="admin@example.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                    >
                        {sending ? (isAr ? 'جاري الإرسال...' : 'Sending...') : isAr ? 'إرسال بريد اختباري' : 'Send Test Email'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
