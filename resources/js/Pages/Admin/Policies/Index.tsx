import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { FileText, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface HighlightCard {
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
}

const DEFAULT_HIGHLIGHTS: Record<string, HighlightCard[]> = {
    privacy: [
        { titleEn: 'Encrypted & Protected', titleAr: 'بيانات مشفرة ومحمية', descEn: 'Your account, addresses, and order history are stored securely.', descAr: 'يتم حفظ بيانات حسابك وعناوينك وطلباتك بأمان تام.' },
        { titleEn: 'Order Fulfillment Only', titleAr: 'لإتمام الطلبات والدعم فقط', descEn: 'We collect only the details needed to deliver your orders.', descAr: 'نجمع فقط بيانات التواصل والشحن اللازمة لتوصيل طلباتك.' },
        { titleEn: 'Full Account Control', titleAr: 'تحكم كامل في حسابك', descEn: 'Update your profile, addresses, and password anytime.', descAr: 'يمكنك تعديل بياناتك وعناوينك وكلمة المرور في أي وقت.' },
    ],
    terms: [
        { titleEn: 'Accurate Order Details', titleAr: 'دقة بيانات الطلب', descEn: 'Provide valid phone numbers and delivery addresses.', descAr: 'يلتزم العميل بتقديم رقم هاتف وعنوان توصيل صحيحين.' },
        { titleEn: 'Pricing & Stock Availability', titleAr: 'الأسعار وتوفر المخزون', descEn: 'Orders are subject to live inventory verification.', descAr: 'تخضع الطلبات للتحقق اللحظي من المخزون عند الإتمام.' },
        { titleEn: 'Fair & Transparent Service', titleAr: 'شفافية ومصداقية كاملة', descEn: 'Track or cancel pending orders directly from your account.', descAr: 'تتبع طلبك أو ألغِ الطلبات المعلقة مباشرة من حسابك.' },
    ],
    refund: [
        { titleEn: '14-Day Return Window', titleAr: 'استرجاع خلال 14 يوماً', descEn: 'Eligible items can be returned within 14 days of delivery.', descAr: 'يمكنك استبدال أو استرجاع المنتجات خلال 14 يوماً من الاستلام.' },
        { titleEn: 'Original Condition', titleAr: 'الحالة الأصلية للمنتج', descEn: 'Items must be unused and in original packaging.', descAr: 'يشترط أن يكون المنتج غير مستخدم وبعبوته الأصلية.' },
        { titleEn: '5–10 Business Days Refund', titleAr: 'رد المبلغ خلال 5–10 أيام عمل', descEn: 'Refunds are issued back to your original payment method.', descAr: 'يتم رد المبلغ بنفس وسيلة الدفع الأصلية خلال 5–10 أيام عمل.' },
    ],
};

function parseHighlights(raw: any, fallback: HighlightCard[]): HighlightCard[] {
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
            // ignore
        }
    }
    return fallback;
}

export default function PoliciesIndex({ policies }: { policies: Record<string, any> }) {
    const { locale } = useTranslation();
    const [tab, setTab] = useState<'privacy' | 'terms' | 'refund' | 'about'>('privacy');

    const form = useForm({
        policy_privacy: policies.policy_privacy || '',
        policy_privacy_ar: policies.policy_privacy_ar || '',
        policy_privacy_highlights: parseHighlights(policies.policy_privacy_highlights, DEFAULT_HIGHLIGHTS.privacy),
        policy_terms: policies.policy_terms || '',
        policy_terms_ar: policies.policy_terms_ar || '',
        policy_terms_highlights: parseHighlights(policies.policy_terms_highlights, DEFAULT_HIGHLIGHTS.terms),
        policy_refund: policies.policy_refund || '',
        policy_refund_ar: policies.policy_refund_ar || '',
        policy_refund_highlights: parseHighlights(policies.policy_refund_highlights, DEFAULT_HIGHLIGHTS.refund),
        about_title: policies.about_title || 'About Us',
        about_title_ar: policies.about_title_ar || 'من نحن',
        about_body: policies.about_body || '',
        about_body_ar: policies.about_body_ar || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/policies', { preserveScroll: true });
    };

    const updateCard = (
        key: 'policy_privacy_highlights' | 'policy_terms_highlights' | 'policy_refund_highlights',
        idx: number,
        field: keyof HighlightCard,
        val: string
    ) => {
        const next = [...form.data[key]];
        next[idx] = { ...next[idx], [field]: val };
        form.setData(key, next);
    };

    const renderPolicyEditor = (
        bodyKey: 'policy_privacy' | 'policy_terms' | 'policy_refund',
        bodyArKey: 'policy_privacy_ar' | 'policy_terms_ar' | 'policy_refund_ar',
        cardsKey: 'policy_privacy_highlights' | 'policy_terms_highlights' | 'policy_refund_highlights'
    ) => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        {locale === 'ar' ? 'النص الرئيسي (إنجليزي)' : 'Main Content (EN)'}
                    </label>
                    <textarea
                        rows={5}
                        dir="ltr"
                        value={form.data[bodyKey]}
                        onChange={(e) => form.setData(bodyKey, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        {locale === 'ar' ? 'النص الرئيسي (عربي)' : 'Main Content (AR)'}
                    </label>
                    <textarea
                        rows={5}
                        dir="rtl"
                        value={form.data[bodyArKey]}
                        onChange={(e) => form.setData(bodyArKey, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {locale === 'ar' ? 'البطاقات التوضيحية الثلاث أسفل السياسة' : '3 Highlight Cards'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {form.data[cardsKey].map((card: HighlightCard, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="text-xs font-bold text-teal-700">#{idx + 1}</div>
                            <input
                                type="text"
                                dir="ltr"
                                placeholder="Title (EN)"
                                value={card.titleEn}
                                onChange={(e) => updateCard(cardsKey, idx, 'titleEn', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white"
                            />
                            <input
                                type="text"
                                dir="rtl"
                                placeholder="العنوان (عربي)"
                                value={card.titleAr}
                                onChange={(e) => updateCard(cardsKey, idx, 'titleAr', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white"
                            />
                            <textarea
                                rows={2}
                                dir="ltr"
                                placeholder="Description (EN)"
                                value={card.descEn}
                                onChange={(e) => updateCard(cardsKey, idx, 'descEn', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white"
                            />
                            <textarea
                                rows={2}
                                dir="rtl"
                                placeholder="الوصف (عربي)"
                                value={card.descAr}
                                onChange={(e) => updateCard(cardsKey, idx, 'descAr', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout title={locale === 'ar' ? 'السياسات وصفحات المتجر' : 'Policies & Pages'}>
            <Head title="Policies & Pages" />

            <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { id: 'privacy', en: 'Privacy Policy', ar: 'سياسة الخصوصية', icon: ShieldCheck },
                            { id: 'terms', en: 'Terms & Conditions', ar: 'الشروط والأحكام', icon: FileText },
                            { id: 'refund', en: 'Return & Refund', ar: 'سياسة الاسترجاع', icon: RotateCcw },
                            { id: 'about', en: 'About Us', ar: 'من نحن', icon: Sparkles },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTab(item.id as any)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        tab === item.id ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-600 border hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? item.ar : item.en}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                    </button>
                </div>

                <div className="p-6">
                    {tab === 'privacy' && renderPolicyEditor('policy_privacy', 'policy_privacy_ar', 'policy_privacy_highlights')}
                    {tab === 'terms' && renderPolicyEditor('policy_terms', 'policy_terms_ar', 'policy_terms_highlights')}
                    {tab === 'refund' && renderPolicyEditor('policy_refund', 'policy_refund_ar', 'policy_refund_highlights')}
                    {tab === 'about' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Title (EN)</label>
                                    <input type="text" dir="ltr" value={form.data.about_title} onChange={(e) => form.setData('about_title', e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">العنوان (عربي)</label>
                                    <input type="text" dir="rtl" value={form.data.about_title_ar} onChange={(e) => form.setData('about_title_ar', e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Story & Mission (EN)</label>
                                    <textarea rows={6} dir="ltr" value={form.data.about_body} onChange={(e) => form.setData('about_body', e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">قصتنا ورؤيتنا (عربي)</label>
                                    <textarea rows={6} dir="rtl" value={form.data.about_body_ar} onChange={(e) => form.setData('about_body_ar', e.target.value)} className="w-full px-3.5 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </AdminLayout>
    );
}
