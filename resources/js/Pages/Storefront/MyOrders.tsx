import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CreditCard, ExternalLink, MapPin, PackageSearch, RefreshCw, ShoppingBag, Tag, Truck, XCircle } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';

const STATUS_BADGE: Record<string, { en: string; ar: string; cls: string }> = {
    pending: { en: 'Pending', ar: 'قيد الانتظار', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
    processing: { en: 'Preparing', ar: 'جاري التجهيز', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    shipped: { en: 'Shipped', ar: 'تم الشحن', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
    delivered: { en: 'Delivered', ar: 'تم التسليم', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    returned: { en: 'Returned', ar: 'مرتجع', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
    cancelled: { en: 'Cancelled', ar: 'ملغي', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    refunded: { en: 'Refunded', ar: 'مسترد', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const PIPELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function MyOrders({ orders, paymentMethods = [] }: { orders: any; paymentMethods?: Array<{ id: number; name: string; name_ar?: string; driver: string }> }) {
    const { t, formatPrice, locale, localized } = useTranslation();
    const [retryingOrder, setRetryingOrder] = useState<string | null>(null);
    const [selectedMethods, setSelectedMethods] = useState<Record<string, number>>({});

    const handleCancel = (orderId: number) => {
        if (!confirm(locale === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) {
            return;
        }
        router.post(`/my-orders/${orderId}/cancel`, {}, { preserveScroll: true });
    };

    const handleRetryPayment = (orderNumber: string, defaultMethodId?: number) => {
        setRetryingOrder(orderNumber);
        const paymentMethodId = selectedMethods[orderNumber] ?? defaultMethodId;
        router.post(
            `/orders/${orderNumber}/retry-payment`,
            paymentMethodId ? { payment_method_id: paymentMethodId } : {},
            {
                preserveScroll: true,
                onFinish: () => setRetryingOrder(null),
            }
        );
    };

    return (
        <StorefrontLayout>
            <SeoHead title={locale === 'ar' ? 'طلباتي' : 'My Orders'} noIndex />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {locale === 'ar' ? 'طلباتي' : 'My Orders'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            {locale === 'ar' ? 'تابع حالة طلباتك وتفاصيل الشحن والفواتير' : 'Track your orders, shipping status, and receipts'}
                        </p>
                    </div>
                    <Link
                        href="/catalog"
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                    >
                        {t('browse_all')}
                    </Link>
                </div>

                {orders.data.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center text-slate-500 shadow-xs">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="mb-5 font-medium">
                            {locale === 'ar' ? 'لم تقم بأي طلبات بعد.' : 'You have not placed any orders yet.'}
                        </p>
                        <Link href="/catalog" className="inline-block px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold">
                            {t('browse_all')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.data.map((o: any) => {
                            const badge = STATUS_BADGE[o.status] || { en: o.status, ar: o.status, cls: 'bg-slate-100 text-slate-700' };
                            const stepIdx = PIPELINE.indexOf(o.status);
                            const addr = o.shipping_address || {};
                            const isEligibleForPayment =
                                o.payment_status !== 'paid' &&
                                (o.status === 'pending' || (o.status === 'cancelled' && o.payment_status === 'failed'));
                            const activeMethodId = selectedMethods[o.order_number] ?? o.payment_method_id ?? o.payment_method?.id;
                            const chosenMethod = paymentMethods.find((m) => m.id === activeMethodId) || o.payment_method;
                            const isChosenOnline = ['myfatoorah', 'fawry'].includes(chosenMethod?.driver);

                            return (
                                <div key={o.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-extrabold text-teal-800 text-base">{o.order_number}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badge.cls}`}>
                                                    {locale === 'ar' ? badge.ar : badge.en}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        o.payment_status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : o.payment_status === 'failed'
                                                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                              : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {o.payment_status === 'paid'
                                                        ? locale === 'ar'
                                                            ? 'مدفوع'
                                                            : 'Paid'
                                                        : o.payment_status === 'failed'
                                                          ? locale === 'ar'
                                                              ? 'فشل الدفع'
                                                              : 'Payment Failed'
                                                          : locale === 'ar'
                                                            ? 'غير مدفوع'
                                                            : o.payment_status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                                {' • '}
                                                {localized(o.payment_method?.name, o.payment_method?.name_ar)}
                                            </div>
                                        </div>

                                        <div className="text-end">
                                            <div className="text-[11px] text-slate-400">{t('total')}</div>
                                            <div className="text-xl font-extrabold text-teal-700">{formatPrice(o.grand_total)}</div>
                                        </div>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    {stepIdx >= 0 && (
                                        <div className="px-6 pt-4">
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {PIPELINE.map((s, idx) => (
                                                    <div key={s} className="space-y-1">
                                                        <div className={`h-1.5 rounded-full ${idx <= stepIdx ? 'bg-teal-600' : 'bg-slate-100'}`} />
                                                        <div className={`text-[10px] font-semibold text-center ${idx <= stepIdx ? 'text-teal-700' : 'text-slate-400'}`}>
                                                            {locale === 'ar' ? STATUS_BADGE[s].ar : STATUS_BADGE[s].en}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items & Address */}
                                    <div className="p-5 sm:p-6 space-y-4">
                                        <div className="space-y-2 text-sm">
                                            {o.items?.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-50 last:border-0">
                                                    <span className="text-slate-800 font-medium">
                                                        {item.product_name}{' '}
                                                        <span className="text-slate-400 font-mono text-xs">× {item.quantity}</span>
                                                    </span>
                                                    <span className="font-bold text-slate-900">{formatPrice(item.total_price)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {addr.city && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{addr.city}{addr.area ? `, ${addr.area}` : ''}</span>
                                                    </span>
                                                )}
                                                {o.coupon_code && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                                        <Tag className="w-3 h-3" />
                                                        <span>{o.coupon_code} (-{formatPrice(o.discount_total)})</span>
                                                    </span>
                                                )}
                                                {parseFloat(o.shipping_total) > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Truck className="w-3 h-3" />
                                                        <span>{formatPrice(o.shipping_total)}</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {isEligibleForPayment && (
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {paymentMethods.length > 0 && (
                                                            <select
                                                                value={activeMethodId || ''}
                                                                onChange={(e) =>
                                                                    setSelectedMethods((prev) => ({
                                                                        ...prev,
                                                                        [o.order_number]: Number(e.target.value),
                                                                    }))
                                                                }
                                                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                                aria-label={locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                                                            >
                                                                {paymentMethods.map((pm) => (
                                                                    <option key={pm.id} value={pm.id}>
                                                                        {localized(pm.name, pm.name_ar)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={retryingOrder === o.order_number}
                                                            onClick={() => handleRetryPayment(o.order_number, activeMethodId)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold transition-colors"
                                                        >
                                                            {retryingOrder === o.order_number ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <CreditCard className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>
                                                                {isChosenOnline
                                                                    ? o.payment_status === 'failed'
                                                                        ? locale === 'ar'
                                                                            ? 'إعادة محاولة الدفع'
                                                                            : 'Retry Payment'
                                                                        : locale === 'ar'
                                                                          ? 'ادفع الآن'
                                                                          : 'Pay Now'
                                                                    : locale === 'ar'
                                                                      ? 'تأكيد طريقة الدفع'
                                                                      : 'Update Payment Method'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                                {o.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancel(o.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>{locale === 'ar' ? 'إلغاء الطلب' : 'Cancel'}</span>
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/track-order?order_number=${o.order_number}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                                                >
                                                    <PackageSearch className="w-3.5 h-3.5" />
                                                    <span>{locale === 'ar' ? 'تتبع' : 'Track'}</span>
                                                </Link>
                                                <Link
                                                    href={`/orders/confirmation/${o.order_number}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
                                                >
                                                    <span>{locale === 'ar' ? 'الإيصال' : 'Receipt'}</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
