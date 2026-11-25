import React from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, MessageCircle, Phone, Send } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';

export default function Contact() {
    const { t, locale, settings } = useTranslation();
    const primaryColor = settings.primary_color || '#0A5C57';

    const form = useForm({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/inquiries', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <StorefrontLayout>
            <SeoHead title={locale === 'ar' ? 'تواصل معنا' : 'Contact Us'} />

            <div
                className="text-white"
                style={{ background: `linear-gradient(135deg, #063F3C 0%, ${primaryColor} 100%)` }}
            >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 animate-fade-up">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base mt-2">
                        {locale === 'ar'
                            ? 'نحن هنا للإجابة على استفساراتك ومساعدتك في طلباتك.'
                            : 'We are here to answer your questions and assist with your orders.'}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-4">
                    {settings.contact_email && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-xs">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase">{t('email')}</div>
                                <a href={`mailto:${settings.contact_email}`} className="font-bold text-sm text-slate-900 hover:text-teal-700">
                                    {settings.contact_email}
                                </a>
                            </div>
                        </div>
                    )}

                    {settings.contact_phone && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-xs">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase">{t('phone')}</div>
                                <div dir="ltr" className="font-bold text-sm text-slate-900 inline-block">{settings.contact_phone}</div>
                            </div>
                        </div>
                    )}

                    {settings.module_whatsapp && settings.whatsapp_number && (
                        <a
                            href={`https://wa.me/${settings.whatsapp_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{t('whatsapp_inquiry')}</span>
                        </a>
                    )}
                </div>

                <form onSubmit={submit} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                    <h2 className="font-extrabold text-lg">{locale === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1">{t('your_name')} *</label>
                            <input
                                type="text"
                                required
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">{t('email')}</label>
                            <input
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">{t('phone')}</label>
                        <input
                            type="text"
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">{t('your_message')} *</label>
                        <textarea
                            rows={4}
                            required
                            value={form.data.message}
                            onChange={(e) => form.setData('message', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs"
                    >
                        <Send className="w-4 h-4" />
                        <span>{t('send_inquiry')}</span>
                    </button>
                </form>
            </div>
        </StorefrontLayout>
    );
}
