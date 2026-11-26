import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Check, PackageSearch } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { useTranslation } from '@/lib/i18n';
import { useRealtimeFeed } from '@/lib/useRealtime';

const TIMELINE_STEPS = [
    { key: 'pending', en: 'Pending', ar: 'قيد الانتظار' },
    { key: 'confirmed', en: 'Confirmed', ar: 'مؤكد' },
    { key: 'processing', en: 'Processing', ar: 'قيد التجهيز' },
    { key: 'shipped', en: 'Shipped', ar: 'تم الشحن' },
    { key: 'delivered', en: 'Delivered', ar: 'تم التسليم' },
];

export default function TrackOrder({
    order,
    notFound,
    filters,
}: {
    order: any | null;
    notFound: boolean;
    filters: Record<string, any>;
}) {
    const { t, formatPrice, locale, localized } = useTranslation();
    const [orderNumber, setOrderNumber] = useState(typeof filters?.order_number === 'string' ? filters.order_number : '');
    const [phone, setPhone] = useState(typeof filters?.phone === 'string' ? filters.phone : '');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/track-order', { order_number: orderNumber, phone });
    };

    const currentStepIdx = order ? TIMELINE_STEPS.findIndex((s) => s.key === order.status) : -1;

    useRealtimeFeed<{ status: string; payment_status: string; tracking_number?: string | null }>(
        order?.order_number ? `/orders/${encodeURIComponent(order.order_number)}/live-status` : null,
        Boolean(order && order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded'),
        (live) => {
            if (
                live.status !== order.status ||
                live.payment_status !== order.payment_status ||
                (live.tracking_number ?? null) !== (order.tracking_number ?? null)
            ) {
                router.reload({ preserveState: true, preserveScroll: true } as any);
            }
        },
        5000
    );

    return (
        <StorefrontLayout>
            <Head title={locale === 'ar' ? 'تتبع الطلب' : 'Track Order'} />

            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
                        <PackageSearch className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-extrabold">{locale === 'ar' ? 'تتبع حالة طلبك' : 'Track Your Order'}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {locale === 'ar' ? 'أدخل رقم الطلب ورقم الهاتف المسجل في الطلب.' : 'Enter your order number and phone number to check status.'}
                    </p>
                </div>

                <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder={locale === 'ar' ? 'رقم الطلب (مثال: ORD-2026...)' : 'Order # (e.g. ORD-2026...)'}
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                            required
                        />
                        <input
                            type="text"
                            placeholder={t('phone_number')}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm">
                        {locale === 'ar' ? 'تتبع الآن' : 'Track Order'}
                    </button>
                </form>

                {notFound && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-center">
                        {locale === 'ar' ? 'لم يتم العثور على طلب مطابق لهذه البيانات.' : 'No order matched the provided order number and phone.'}
                    </div>
                )}

                {order && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                            <div>
                                <div className="text-xs text-slate-500">{t('order_number')}</div>
                                <div className="font-mono font-bold text-lg text-teal-800">{order.order_number}</div>
                            </div>
                            <div className="text-end">
                                <div className="text-xs text-slate-500">{t('total')}</div>
                                <div className="font-extrabold text-lg">{formatPrice(order.grand_total)}</div>
                            </div>
                        </div>

                        {currentStepIdx >= 0 ? (
                            <div className="grid grid-cols-5 gap-2">
                                {TIMELINE_STEPS.map((st, idx) => {
                                    const done = idx <= currentStepIdx;
                                    return (
                                        <div key={st.key} className="text-center">
                                            <div
                                                className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                                                    done ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {done ? <Check className="w-4 h-4" /> : idx + 1}
                                            </div>
                                            <div className={`text-[11px] mt-1.5 font-semibold ${done ? 'text-teal-800' : 'text-slate-400'}`}>
                                                {locale === 'ar' ? st.ar : st.en}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold text-center uppercase">
                                {order.status}
                            </div>
                        )}

                        <div className="space-y-2 border-t pt-4 text-sm">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.product_name} × {item.quantity}</span>
                                    <span className="font-semibold">{formatPrice(item.total_price)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-xs text-slate-500 flex justify-between border-t pt-3">
                            <span>{localized(order.payment_method?.name, order.payment_method?.name_ar)}</span>
                            <span className="font-semibold uppercase">{order.payment_status}</span>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
