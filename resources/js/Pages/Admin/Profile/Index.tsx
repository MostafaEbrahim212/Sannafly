import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, User } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function ProfileIndex({ user }: { user: any }) {
    const { t, locale } = useTranslation();

    const infoForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });

    const passForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const saveInfo = (e: React.FormEvent) => {
        e.preventDefault();
        infoForm.put('/admin/profile');
    };

    const savePassword = (e: React.FormEvent) => {
        e.preventDefault();
        passForm.put('/admin/profile/password', {
            onSuccess: () => passForm.reset(),
        });
    };

    return (
        <AdminLayout title={locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}>
            <Head title={locale === 'ar' ? 'الملف الشخصي' : 'My Profile'} />

            <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={saveInfo} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <h2 className="font-bold text-base flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-600" />
                        <span>{locale === 'ar' ? 'البيانات الشخصية' : 'Account Details'}</span>
                    </h2>

                    <div>
                        <label className="block text-xs font-semibold mb-1">{t('full_name')}</label>
                        <input
                            type="text"
                            value={infoForm.data.name}
                            onChange={(e) => infoForm.setData('name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        {infoForm.errors.name && <p className="text-xs text-red-600 mt-1">{infoForm.errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1">{t('email')}</label>
                        <input
                            type="email"
                            value={infoForm.data.email}
                            onChange={(e) => infoForm.setData('email', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        {infoForm.errors.email && <p className="text-xs text-red-600 mt-1">{infoForm.errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1">{t('phone')}</label>
                        <input
                            type="text"
                            value={infoForm.data.phone}
                            onChange={(e) => infoForm.setData('phone', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={infoForm.processing}
                        className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                    >
                        {t('save')}
                    </button>
                </form>

                <form onSubmit={savePassword} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <h2 className="font-bold text-base flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-indigo-600" />
                        <span>{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                    </h2>

                    <div>
                        <label className="block text-xs font-semibold mb-1">
                            {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                        </label>
                        <input
                            type="password"
                            value={passForm.data.current_password}
                            onChange={(e) => passForm.setData('current_password', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        {passForm.errors.current_password && <p className="text-xs text-red-600 mt-1">{passForm.errors.current_password}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1">
                            {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                        </label>
                        <input
                            type="password"
                            value={passForm.data.password}
                            onChange={(e) => passForm.setData('password', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        {passForm.errors.password && <p className="text-xs text-red-600 mt-1">{passForm.errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1">
                            {locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                        </label>
                        <input
                            type="password"
                            value={passForm.data.password_confirmation}
                            onChange={(e) => passForm.setData('password_confirmation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={passForm.processing}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                        {locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
