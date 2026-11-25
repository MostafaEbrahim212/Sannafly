import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CreditCard, FlaskConical, KeyRound, Settings2, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function PaymentMethodsIndex({ paymentMethods }: { paymentMethods: any[] }) {
    const { t, localized, locale } = useTranslation();
    const [configuring, setConfiguring] = useState<any | null>(null);
    const [formState, setFormState] = useState<any>({});

    const openConfig = (pm: any) => {
        setConfiguring(pm);
        setFormState({
            name: pm.name,
            name_ar: pm.name_ar || '',
            description: pm.description || '',
            description_ar: pm.description_ar || '',
            is_active: Boolean(pm.is_active),
            is_visible: Boolean(pm.is_visible),
            sort_order: pm.sort_order ?? 0,
            sandbox: Boolean(pm.gateway_meta?.sandbox ?? true),
            country: pm.gateway_meta?.country || 'EGY',
            merchant_code: pm.gateway_meta?.merchant_code || '',
            api_key: '',
            security_key: '',
            bank_name: pm.gateway_meta?.bank_name || '',
            account_name: pm.gateway_meta?.account_name || '',
            account_number: pm.gateway_meta?.account_number || '',
            iban: pm.gateway_meta?.iban || '',
            pickup_address: pm.gateway_meta?.pickup_address || '',
            pickup_hours: pm.gateway_meta?.pickup_hours || '',
        });
    };

    const toggle = (pm: any) => {
        router.put(`/admin/payment-methods/${pm.id}`, {
            name: pm.name,
            name_ar: pm.name_ar,
            description: pm.description,
            description_ar: pm.description_ar,
            is_active: !pm.is_active,
            is_visible: pm.is_visible,
            sort_order: pm.sort_order,
        });
    };

    const saveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        if (!configuring) return;
        router.put(`/admin/payment-methods/${configuring.id}`, formState, {
            onSuccess: () => setConfiguring(null),
        });
    };

    const isGateway = (driver: string) => driver === 'myfatoorah' || driver === 'fawry';

    return (
        <AdminLayout title={t('payment_methods')}>
            <Head title={t('payment_methods')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paymentMethods.map((pm) => {
                    const gateway = isGateway(pm.driver);
                    const sandbox = Boolean(pm.gateway_meta?.sandbox ?? true);
                    const configured =
                        pm.driver === 'myfatoorah'
                            ? pm.gateway_meta?.has_api_key
                            : pm.driver === 'fawry'
                            ? Boolean(pm.gateway_meta?.merchant_code && pm.gateway_meta?.has_security_key)
                            : true;

                    return (
                        <div
                            key={pm.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5 shadow-xs"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3 gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        {gateway && (
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    sandbox
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                }`}
                                            >
                                                <FlaskConical className="w-3 h-3" />
                                                {sandbox ? 'SANDBOX' : 'LIVE'}
                                            </span>
                                        )}
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                pm.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {pm.is_active ? t('active') : t('disabled')}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="font-bold text-base">{localized(pm.name, pm.name_ar)}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{localized(pm.description, pm.description_ar)}</p>

                                {gateway && (
                                    <div className="mt-3 flex items-center gap-1.5 text-xs">
                                        {configured ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'تم ضبط مفاتيح الربط' : 'Credentials configured'}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                                <KeyRound className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'يحتاج إعداد مفاتيح الربط' : 'Needs API credentials'}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggle(pm)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                                        pm.is_active
                                            ? 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                                            : 'bg-teal-700 hover:bg-teal-800 text-white'
                                    }`}
                                >
                                    {pm.is_active ? t('disable_method') : t('enable_method')}
                                </button>
                                <button
                                    onClick={() => openConfig(pm)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5"
                                    title="Configure"
                                >
                                    <Settings2 className="w-4 h-4 text-slate-600" />
                                    <span>{locale === 'ar' ? 'إعدادات' : 'Config'}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            {configuring && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <form
                        onSubmit={saveConfig}
                        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-base">
                                <ShieldCheck className="w-5 h-5 text-teal-700" />
                                <span>{localized(configuring.name, configuring.name_ar)}</span>
                            </div>
                            <button type="button" onClick={() => setConfiguring(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Name (EN)</label>
                                    <input
                                        type="text"
                                        value={formState.name}
                                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">الاسم (عربي)</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={formState.name_ar}
                                        onChange={(e) => setFormState({ ...formState, name_ar: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                            </div>

                            {isGateway(configuring.driver) && (
                                <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold flex items-center gap-1.5">
                                                <FlaskConical className="w-4 h-4 text-amber-600" />
                                                <span>{locale === 'ar' ? 'وضع التجربة (Sandbox Mode)' : 'Sandbox / Test Mode'}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {locale === 'ar' ? 'فعّل هذا الخيار للاختبار بدون خصم حقيقي.' : 'Enable for testing with gateway sandbox URLs.'}
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formState.sandbox)}
                                            onChange={(e) => setFormState({ ...formState, sandbox: e.target.checked })}
                                            className="h-4 w-4 rounded text-teal-600"
                                        />
                                    </div>

                                    {configuring.driver === 'myfatoorah' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">Country</label>
                                                <select
                                                    value={formState.country}
                                                    onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                                >
                                                    <option value="EGY">Egypt (EGY)</option>
                                                    <option value="SAU">Saudi Arabia (SAU)</option>
                                                    <option value="KWT">Kuwait (KWT)</option>
                                                    <option value="ARE">UAE (ARE)</option>
                                                    <option value="QAT">Qatar (QAT)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">MyFatoorah API Token</label>
                                                <input
                                                    type="password"
                                                    value={formState.api_key}
                                                    onChange={(e) => setFormState({ ...formState, api_key: e.target.value })}
                                                    placeholder={configuring.gateway_meta?.has_api_key ? '•••••••• (saved — leave blank to keep)' : 'Enter Bearer API Key'}
                                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white font-mono"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {configuring.driver === 'fawry' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">Fawry Merchant Code</label>
                                                <input
                                                    type="text"
                                                    value={formState.merchant_code}
                                                    onChange={(e) => setFormState({ ...formState, merchant_code: e.target.value })}
                                                    placeholder="e.g. 1tSa6uxz2n..."
                                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1">Fawry Security Key</label>
                                                <input
                                                    type="password"
                                                    value={formState.security_key}
                                                    onChange={(e) => setFormState({ ...formState, security_key: e.target.value })}
                                                    placeholder={configuring.gateway_meta?.has_security_key ? '•••••••• (saved — leave blank to keep)' : 'Enter Security Key'}
                                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white font-mono"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {configuring.driver === 'bank_transfer' && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="text-xs font-bold text-slate-700">
                                        {locale === 'ar' ? 'بيانات الحساب البنكي للتحويل' : 'Bank Account Details'}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1">{locale === 'ar' ? 'اسم البنك' : 'Bank Name'}</label>
                                            <input
                                                type="text"
                                                value={formState.bank_name}
                                                onChange={(e) => setFormState({ ...formState, bank_name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1">{locale === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder'}</label>
                                            <input
                                                type="text"
                                                value={formState.account_name}
                                                onChange={(e) => setFormState({ ...formState, account_name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1">{locale === 'ar' ? 'رقم الحساب' : 'Account Number'}</label>
                                            <input
                                                type="text"
                                                value={formState.account_number}
                                                onChange={(e) => setFormState({ ...formState, account_number: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border text-sm bg-white font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1">IBAN</label>
                                            <input
                                                type="text"
                                                value={formState.iban}
                                                onChange={(e) => setFormState({ ...formState, iban: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border text-sm bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {configuring.driver === 'cash' && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="text-xs font-bold text-slate-700">
                                        {locale === 'ar' ? 'بيانات الاستلام من المتجر' : 'Store Pickup Details'}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{locale === 'ar' ? 'عنوان الفرع' : 'Pickup Address'}</label>
                                        <input
                                            type="text"
                                            value={formState.pickup_address}
                                            onChange={(e) => setFormState({ ...formState, pickup_address: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{locale === 'ar' ? 'مواعيد العمل' : 'Working Hours'}</label>
                                        <input
                                            type="text"
                                            value={formState.pickup_hours}
                                            onChange={(e) => setFormState({ ...formState, pickup_hours: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={Boolean(formState.is_active)}
                                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                                />
                                <span>{locale === 'ar' ? 'تفعيل طريقة الدفع في المتجر' : 'Enable on storefront checkout'}</span>
                            </label>
                        </div>

                        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfiguring(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold bg-white">
                                {t('cancel')}
                            </button>
                            <button type="submit" className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                                {t('save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
