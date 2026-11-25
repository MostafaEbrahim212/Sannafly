import React from 'react';
import { Link } from '@inertiajs/react';
import { CheckCircle2, FileText, Lock, Mail, MessageCircle, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';

interface PolicyProps {
    slug: string;
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
    highlights?: Array<{ titleEn: string; titleAr: string; descEn: string; descAr: string }> | null;
}

const HIGHLIGHTS: Record<
    string,
    Array<{ icon: any; titleEn: string; titleAr: string; descEn: string; descAr: string }>
> = {
    'privacy-policy': [
        {
            icon: Lock,
            titleEn: 'Encrypted & Protected',
            titleAr: 'بيانات مشفرة ومحمية',
            descEn: 'Your account, addresses, and order history are stored securely and never shared with unauthorized parties.',
            descAr: 'يتم حفظ بيانات حسابك وعناوينك وطلباتك بأمان تام دون مشاركتها مع أي جهات غير مصرح لها.',
        },
        {
            icon: ShieldCheck,
            titleEn: 'Order Fulfillment Only',
            titleAr: 'لإتمام الطلبات والدعم فقط',
            descEn: 'We collect only the contact and shipping details needed to deliver your orders and notify you of updates.',
            descAr: 'نجمع فقط بيانات التواصل والشحن اللازمة لتوصيل طلباتك وإرسال تحديثات الحالة.',
        },
        {
            icon: CheckCircle2,
            titleEn: 'Full Account Control',
            titleAr: 'تحكم كامل في حسابك',
            descEn: 'You can update your profile, saved addresses, and password anytime from your account settings.',
            descAr: 'يمكنك تعديل بياناتك الشخصية وعناوينك وكلمة المرور في أي وقت من صفحة حسابك.',
        },
    ],
    terms: [
        {
            icon: FileText,
            titleEn: 'Accurate Order Details',
            titleAr: 'دقة بيانات الطلب',
            descEn: 'Customers are responsible for providing valid phone numbers and delivery addresses for smooth fulfillment.',
            descAr: 'يلتزم العميل بتقديم رقم هاتف وعنوان توصيل صحيحين لضمان سرعة ودقة التوصيل.',
        },
        {
            icon: CheckCircle2,
            titleEn: 'Pricing & Stock Availability',
            titleAr: 'الأسعار وتوفر المخزون',
            descEn: 'All orders are subject to live inventory verification at checkout. Prices are clearly displayed before confirmation.',
            descAr: 'تخضع الطلبات للتحقق اللحظي من المخزون عند الإتمام، وتُعرض الأسعار النهائية بوضوح قبل التأكيد.',
        },
        {
            icon: ShieldCheck,
            titleEn: 'Fair & Transparent Service',
            titleAr: 'شفافية ومصداقية كاملة',
            descEn: 'You can track your order status step-by-step or cancel pending orders directly from your account.',
            descAr: 'يمكنك تتبع حالة طلبك خطوة بخطوة أو إلغاء الطلبات قيد الانتظار مباشرة من حسابك.',
        },
    ],
    'refund-policy': [
        {
            icon: RotateCcw,
            titleEn: '14-Day Return Window',
            titleAr: 'استرجاع خلال 14 يوماً',
            descEn: 'Eligible items can be returned or exchanged within 14 days from the delivery date.',
            descAr: 'يمكنك طلب استبدال أو استرجاع المنتجات المؤهلة خلال 14 يوماً من تاريخ الاستلام.',
        },
        {
            icon: Truck,
            titleEn: 'Original Condition',
            titleAr: 'الحالة الأصلية للمنتج',
            descEn: 'Returned items must be unused, in original packaging, and accompanied by the order number or receipt.',
            descAr: 'يشترط أن يكون المنتج غير مستخدم وبعبوته الأصلية مع توفر رقم الطلب أو الفاتورة.',
        },
        {
            icon: CheckCircle2,
            titleEn: '5–10 Business Days Refund',
            titleAr: 'رد المبلغ خلال 5–10 أيام عمل',
            descEn: 'Once inspected, refunds are issued back to your original payment method promptly.',
            descAr: 'بعد الفحص، يتم رد المبلغ بنفس وسيلة الدفع الأصلية خلال 5 إلى 10 أيام عمل.',
        },
    ],
};

export default function Policy({ slug, titleEn, titleAr, bodyEn, bodyAr, highlights }: PolicyProps) {
    const { localized, t, locale, settings } = useTranslation();
    const title = localized(titleEn, titleAr);
    const body = localized(bodyEn, bodyAr);
    const primaryColor = settings.primary_color || '#0A5C57';
    const items = highlights && highlights.length > 0 ? highlights : (HIGHLIGHTS[slug] || []);

    const navLinks = [
        { s: 'privacy-policy', icon: ShieldCheck, en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
        { s: 'terms', icon: FileText, en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
        { s: 'refund-policy', icon: RotateCcw, en: 'Return & Refund Policy', ar: 'سياسة الاستبدال والاسترجاع' },
    ];

    const ActiveIcon = navLinks.find((n) => n.s === slug)?.icon || ShieldCheck;

    return (
        <StorefrontLayout>
            <SeoHead title={title} description={body.slice(0, 155)} />

            {/* Branded Hero Header */}
            <div
                className="text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, #063F3C 0%, ${primaryColor} 100%)` }}
            >
                <div className="pointer-events-none absolute -top-20 -end-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10 animate-fade-up">
                    <nav className="text-xs text-white/70 flex items-center gap-2 mb-4">
                        <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
                        <span>/</span>
                        <span className="text-white font-semibold">{title}</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                            <ActiveIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
                            <p className="text-xs sm:text-sm text-white/80 mt-1">
                                {locale === 'ar'
                                    ? 'وثيقة السياسات الرسمية — التزامنا بالوضوح وحماية حقوقك'
                                    : 'Official Store Policy — Clear terms & full transparency'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs space-y-1.5">
                        {navLinks.map((p) => {
                            const Icon = p.icon;
                            const active = slug === p.s;
                            return (
                                <Link
                                    key={p.s}
                                    href={`/policies/${p.s}`}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                                        active
                                            ? 'bg-teal-700 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{locale === 'ar' ? p.ar : p.en}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                        <div className="text-sm font-extrabold text-slate-900">
                            {locale === 'ar' ? 'هل لديك استفسار؟' : 'Need Clarification?'}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {locale === 'ar'
                                ? 'فريق خدمة العملاء جاهز للرد على أي أسئلة تخص طلباتك أو سياسات المتجر.'
                                : 'Our support team is happy to help with any questions regarding your orders or store policies.'}
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                            {settings.contact_email && (
                                <a
                                    href={`mailto:${settings.contact_email}`}
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:underline"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{settings.contact_email}</span>
                                </a>
                            )}
                            {settings.module_whatsapp && settings.whatsapp_number && (
                                <a
                                    href={`https://wa.me/${settings.whatsapp_number}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors mt-1"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{t('whatsapp_inquiry')}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Policy Content */}
                <div className="lg:col-span-8 space-y-6 animate-fade-up">
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-7 sm:p-10 shadow-xs space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'سياسة معتمدة' : 'Verified Policy'}</span>
                        </div>
                        <div className="text-slate-700 leading-loose whitespace-pre-line text-sm sm:text-base">
                            {body}
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {items.map((item: any, idx: number) => {
                                const fallbackIcons = [ShieldCheck, FileText, RotateCcw];
                                const Icon = item.icon || fallbackIcons[idx % fallbackIcons.length];
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2.5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-sm text-slate-900">
                                            {locale === 'ar' ? item.titleAr : item.titleEn}
                                        </h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {locale === 'ar' ? item.descAr : item.descEn}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
