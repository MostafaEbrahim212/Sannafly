import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPassword({ isAdmin = false, status }: { isAdmin?: boolean; status?: string }) {
    const { dir, locale } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(isAdmin ? '/admin/forgot-password' : '/forgot-password');
    };

    return (
        <div dir={dir} className={`min-h-screen flex items-center justify-center px-4 ${isAdmin ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <Head title={locale === 'ar' ? 'استعادة كلمة المرور' : 'Forgot Password'} />

            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                <div className="flex items-center justify-center">
                    <BrandLogo variant="light" size="lg" />
                </div>

                <div className="text-center">
                    <h1 className="text-xl font-bold">
                        {locale === 'ar' ? 'استعادة كلمة المرور' : 'Forgot Password'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {locale === 'ar'
                            ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
                            : 'Enter your email address and we will send you a password reset link.'}
                    </p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                autoFocus
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full ps-10 pe-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm disabled:opacity-60"
                    >
                        <KeyRound className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}</span>
                    </button>
                </form>

                <div className="text-center text-xs">
                    <Link href={isAdmin ? '/admin/login' : '/login'} className="text-teal-700 font-semibold hover:underline">
                        ← {locale === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
