import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Award, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';

interface AboutProps {
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
}

export default function About({ titleEn, titleAr, bodyEn, bodyAr }: AboutProps) {
    const { localized, t, locale, dir, settings } = useTranslation();
    const title = localized(titleEn, titleAr) || (locale === 'ar' ? 'من نحن' : 'About Us');
    const body = localized(bodyEn, bodyAr);
    const primaryColor = settings.primary_color || '#0A5C57';

    const pillars = [
        {
            icon: Award,
            en: 'Curated Quality',
            ar: 'جودة منتقاة بعناية',
            descEn: 'Every item in our catalog is selected for reliability, durability, and real everyday value.',
            descAr: 'كل منتج في متجرنا مختار بعناية لضمان الجودة والمتانة والقيمة الحقيقية.',
        },
        {
            icon: Truck,
            en: 'Fast & Reliable Shipping',
            ar: 'شحن سريع وموثوق',
            descEn: 'Transparent zone-based shipping rates and live order tracking from checkout to doorstep.',
            descAr: 'أسعار شحن واضحة حسب المحافظة وتتبع لحظي للطلب حتى باب منزلك.',
        },
        {
            icon: ShieldCheck,
            en: 'Trusted Customer Care',
            ar: 'دعم وخدمة عملاء موثوقة',
            descEn: 'Clear return policies, verified reviews, and direct support whenever you need assistance.',
            descAr: 'سياسات استرجاع واضحة وتقييمات حقيقية ودعم مباشر في أي وقت.',
        },
    ];

    return (
        <StorefrontLayout>
            <SeoHead title={title} description={body.slice(0, 155)} />

            <div
                className="text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, #063F3C 0%, ${primaryColor} 100%)` }}
            >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10 animate-fade-up">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-slate-950 mb-4" style={{ backgroundColor: settings.accent_color || '#F6A21E' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{localized(settings.site_name || 'Sannafly', settings.site_name_ar)}</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{title}</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs text-slate-700 leading-loose whitespace-pre-line text-base animate-fade-up">
                    {body}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {pillars.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div key={p.en} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-slate-900">{locale === 'ar' ? p.ar : p.en}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{locale === 'ar' ? p.descAr : p.descEn}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <Link
                        href="/catalog"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs"
                    >
                        <span>{t('browse_all')}</span>
                        <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm"
                    >
                        <span>{locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
}
