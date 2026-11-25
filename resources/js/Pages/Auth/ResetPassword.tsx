import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import { useTranslation } from '@/lib/i18n';

export default function ResetPassword({ token, email, isAdmin = false }: { token: string; email: string; isAdmin?: boolean }) {
    const { dir, locale } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(isAdmin ? '/admin/reset-password' : '/reset-password');
    };

    return (
        <div dir={dir} className={`min-h-screen flex items-center justify-center px-4 ${isAdmin ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <Head title={locale === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Reset Password'} />

            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                <div className="flex items-center justify-center">
                    <BrandLogo variant="light" size="lg" />
                </div>

                <h1 className="text-xl font-bold text-center">
                    {locale === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Reset Password'}
                </h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <input
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                        {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                        </label>
                        <input
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                        {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        </label>
                        <input
                            type="password"
                            required
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm disabled:opacity-60"
                    >
                        <Lock className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'حفظ كلمة المرور' : 'Reset Password'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
