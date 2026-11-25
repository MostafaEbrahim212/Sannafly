import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import { useTranslation } from '@/lib/i18n';

export default function Login({ isAdminLogin = false }: { isAdminLogin?: boolean }) {
    const { t, dir, locale } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(isAdminLogin ? '/admin/login' : '/login');
    };

    return (
        <div dir={dir} className={`min-h-screen flex items-center justify-center px-4 ${isAdminLogin ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <Head title={isAdminLogin ? (locale === 'ar' ? 'دخول الإدارة' : 'Admin Sign In') : t('login')} />
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center mb-4">
                    <BrandLogo variant="light" size="lg" />
                </div>

                <h1 className="text-xl font-bold text-center mb-1">
                    {isAdminLogin ? (locale === 'ar' ? 'تسجيل دخول الإدارة' : 'Admin Portal') : t('login')}
                </h1>
                {isAdminLogin && (
                    <p className="text-xs text-slate-500 text-center mb-6">
                        {locale === 'ar' ? 'منطقة مخصصة للمشرفين والموظفين فقط' : 'Restricted to authorized administrators and staff'}
                    </p>
                )}

                <form onSubmit={submit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                            autoFocus
                        />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                        />
                        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                        <label className="flex items-center gap-2 text-slate-600">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-slate-300 text-teal-600"
                            />
                            <span>{t('remember_me')}</span>
                        </label>
                        <Link
                            href={isAdminLogin ? '/admin/forgot-password' : '/forgot-password'}
                            className="text-teal-700 font-semibold hover:underline"
                        >
                            {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm disabled:opacity-60"
                    >
                        <Lock className="w-4 h-4" />
                        <span>{t('login')}</span>
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs">
                    <Link href="/" className="text-slate-500 hover:text-slate-800">
                        ← {t('storefront')}
                    </Link>
                    {!isAdminLogin && (
                        <Link href="/register" className="text-teal-700 font-semibold hover:underline">
                            {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create an account'}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
