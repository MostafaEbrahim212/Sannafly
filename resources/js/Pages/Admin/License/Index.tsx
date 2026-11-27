import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Globe, KeyRound, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface LicenseStatus {
    status: string;
    type: string | null;
    domain: string | null;
    masked_key: string | null;
    activated_at: string | null;
    expires_at: string | null;
    last_checked_at: string | null;
    in_grace_period: boolean;
    server_configured: boolean;
}

interface UpdateInfo {
    current_version: string;
    release_date: string;
    remote_configured: boolean;
    update_available: boolean;
    latest_version: string | null;
    notes: string | null;
    message: string;
}

interface Props {
    license: LicenseStatus;
    updateInfo: UpdateInfo;
    product: { name: string; version: string; edition: string };
    currentDomain: string;
}

export default function LicenseIndex({ license, updateInfo, product, currentDomain }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [licenseKey, setLicenseKey] = useState('');
    const [type, setType] = useState<'single' | 'multi' | 'developer' | 'lifetime' | 'subscription'>('single');
    const [busy, setBusy] = useState(false);

    const activate = (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.post('/admin/license/activate', { license_key: licenseKey, type }, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const deactivate = () => {
        if (!confirm(isAr ? 'إلغاء تفعيل الترخيص من هذا الدومين؟' : 'Deactivate license from this domain?')) return;
        router.post('/admin/license/deactivate', {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title={isAr ? 'الترخيص والتحديثات' : 'License & Updates'}>
            <Head title={isAr ? 'الترخيص والتحديثات' : 'License & Updates'} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-teal-600" />
                        {isAr ? 'إدارة الترخيص والإصدار' : 'Commercial License & Version'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {product.name} • v{product.version} ({product.edition})
                    </p>
                </div>

                {/* License Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {license.status === 'active' ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            ) : (
                                <XCircle className="w-8 h-8 text-amber-500" />
                            )}
                            <div>
                                <div className="text-base font-bold">
                                    {license.status === 'active'
                                        ? isAr ? 'الترخيص مفعّل' : 'License Active'
                                        : isAr ? 'الترخيص غير مفعّل' : 'License Inactive'}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{license.domain || currentDomain}</span>
                                    {license.masked_key && <span className="font-mono">• {license.masked_key}</span>}
                                </div>
                            </div>
                        </div>

                        {license.status === 'active' && (
                            <button
                                type="button"
                                onClick={deactivate}
                                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                            >
                                {isAr ? 'إلغاء التفعيل' : 'Deactivate'}
                            </button>
                        )}
                    </div>

                    {license.status === 'active' && (
                        <div className="grid sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">{isAr ? 'نوع الترخيص:' : 'Type:'}</span>{' '}
                                <strong className="uppercase">{license.type}</strong>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">{isAr ? 'تاريخ التفعيل:' : 'Activated:'}</span>{' '}
                                <strong>{license.activated_at?.slice(0, 10) || '—'}</strong>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className="text-slate-500">{isAr ? 'الانتهاء:' : 'Expires:'}</span>{' '}
                                <strong>{license.expires_at ? license.expires_at.slice(0, 10) : isAr ? 'مدى الحياة' : 'Lifetime'}</strong>
                            </div>
                        </div>
                    )}

                    <form onSubmit={activate} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {isAr ? 'تفعيل أو تحديث مفتاح الترخيص' : 'Activate / Update License Key'}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                            <input
                                type="text"
                                required
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border text-sm font-mono uppercase"
                            />
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="px-3.5 py-2.5 rounded-xl border text-sm"
                            >
                                <option value="single">Single Website</option>
                                <option value="multi">Multi Website</option>
                                <option value="developer">Developer License</option>
                                <option value="lifetime">Lifetime License</option>
                                <option value="subscription">Subscription</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={busy}
                            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                        >
                            {busy ? (isAr ? 'جاري التفعيل...' : 'Activating...') : isAr ? 'تفعيل الترخيص' : 'Activate License'}
                        </button>
                    </form>
                </div>

                {/* Version & Updates Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-teal-600" />
                            {isAr ? 'الإصدار والتحديثات' : 'Version & Update Status'}
                        </h2>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-mono font-bold">
                            v{updateInfo.current_version}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">{updateInfo.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                            {isAr
                                ? 'يتم تطبيق فترة سماح 14 يومًا عند تعذر الاتصال بخادم التراخيص لضمان عدم توقف متجرك.'
                                : 'Includes a 14-day grace period when offline so your live store never experiences sudden downtime.'}
                        </span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
