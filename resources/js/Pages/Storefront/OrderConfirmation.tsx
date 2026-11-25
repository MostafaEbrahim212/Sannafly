import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, CreditCard, MapPin, PackageSearch, Printer, ShoppingBag, Tag, Truck } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';

const STEPS = [
    { key: 'pending', en: 'Pending', ar: 'تم الاستلام' },
    { key: 'confirmed', en: 'Confirmed', ar: 'مؤكد' },
    { key: 'processing', en: 'Preparing', ar: 'جاري التجهيز' },
    { key: 'shipped', en: 'Shipped', ar: 'تم الشحن' },
    { key: 'delivered', en: 'Delivered', ar: 'تم التسليم' },
];

export default function OrderConfirmation({ order, paymentMeta = null }: { order: any; paymentMeta?: any }) {
    const { t, formatPrice, locale, localized } = useTranslation();
    const addr = order.shipping_address || {};
    const stepIdx = STEPS.findIndex((s) => s.key === order.status);

    return (
        <StorefrontLayout>
            <SeoHead title={`${t('order_number')} ${order.order_number}`} noIndex />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
                {/* Celebratory Header */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xs space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                            {t('thank_you')}, {order.customer_name}!
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5">
                            {t('order_received_msg')}{' '}
                            <span className="font-mono font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg">
                                {order.order_number}
                            </span>
                        </p>
                    </div>

                    {/* Progress Stepper */}
                    {stepIdx >= 0 ? (
                        <div className="pt-4 max-w-xl mx-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {STEPS.map((s, idx) => {
                                    const active = idx <= stepIdx;
                                    return (
                                        <div key={s.key} className="space-y-1.5">
                                            <div className={`h-2 rounded-full ${active ? 'bg-teal-600' : 'bg-slate-100'}`} />
                                            <div className={`text-[10px] sm:text-[11px] font-bold ${active ? 'text-teal-800' : 'text-slate-400'}`}>
                                                {locale === 'ar' ? s.ar : s.en}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase">
                            {order.status}
                        </div>
                    )}
                </div>

                {/* Payment Reference Banner */}
                {order.payments?.[0]?.transaction_reference && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-2">
                        <span>{locale === 'ar' ? 'رقم المرجع للدفع:' : 'Payment Reference:'}</span>
                        <span className="font-mono font-extrabold text-base">{order.payments[0].transaction_reference}</span>
                    </div>
                )}

                {/* Bank Transfer Instructions */}
                {order.payment_method?.driver === 'bank_transfer' && order.payment_status === 'unpaid' && paymentMeta?.bank_name && (
                    <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm space-y-1.5">
                        <div className="font-extrabold">{locale === 'ar' ? 'بيانات التحويل البنكي لإتمام الطلب:' : 'Bank Transfer Instructions:'}</div>
                        <div><strong>{locale === 'ar' ? 'البنك:' : 'Bank:'}</strong> {paymentMeta.bank_name}</div>
                        {paymentMeta.account_name && <div><strong>{locale === 'ar' ? 'اسم الحساب:' : 'Account Holder:'}</strong> {paymentMeta.account_name}</div>}
                        {paymentMeta.account_number && <div className="font-mono"><strong>{locale === 'ar' ? 'رقم الحساب:' : 'Account #:'}</strong> {paymentMeta.account_number}</div>}
                        {paymentMeta.iban && <div className="font-mono"><strong>IBAN:</strong> {paymentMeta.iban}</div>}
                    </div>
                )}

                {/* Store Pickup Instructions */}
                {order.payment_method?.driver === 'cash' && paymentMeta?.pickup_address && (
                    <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs sm:text-sm space-y-1">
                        <div className="font-extrabold">{locale === 'ar' ? 'تفاصيل الاستلام من المتجر:' : 'Store Pickup Details:'}</div>
                        <div><strong>{locale === 'ar' ? 'العنوان:' : 'Address:'}</strong> {paymentMeta.pickup_address}</div>
                        {paymentMeta.pickup_hours && <div><strong>{locale === 'ar' ? 'مواعيد العمل:' : 'Hours:'}</strong> {paymentMeta.pickup_hours}</div>}
                    </div>
                )}

                {/* Receipt Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <div className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                                <span>{locale === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</span>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm">
                                {addr.city || '—'}{addr.area ? `, ${addr.area}` : ''}
                            </div>
                            {addr.street && <div className="text-slate-600">{addr.street}</div>}
                        </div>

                        <div className="space-y-1">
                            <div className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                                <span>{locale === 'ar' ? 'طريقة الدفع والحالة' : 'Payment Details'}</span>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm">
                                {localized(order.payment_method?.name, order.payment_method?.name_ar)}
                            </div>
                            <div className="text-slate-500 uppercase font-bold">
                                {order.payment_status === 'paid' ? (locale === 'ar' ? 'مدفوع' : 'Paid') : (locale === 'ar' ? 'قيد الدفع / عند الاستلام' : order.payment_status)}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-3">
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                                <div>
                                    <div className="font-semibold text-slate-900">{item.product_name}</div>
                                    <div className="text-xs text-slate-400 font-mono">{item.sku} × {item.quantity}</div>
                                </div>
                                <span className="font-bold text-slate-900">{formatPrice(item.total_price)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-50/80 border-t border-slate-100 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                            <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                        </div>
                        {parseFloat(order.discount_total) > 0 && (
                            <div className="flex justify-between text-emerald-700">
                                <span className="inline-flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'الخصم' : 'Discount'} {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                                </span>
                                <span className="font-semibold">-{formatPrice(order.discount_total)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                            <span className="inline-flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'الشحن' : 'Shipping'}</span>
                            </span>
                            <span className="font-semibold">
                                {parseFloat(order.shipping_total) === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatPrice(order.shipping_total)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center font-extrabold text-lg pt-3 border-t border-slate-200">
                            <span>{t('total')}</span>
                            <span className="text-teal-700">{formatPrice(order.grand_total)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'طباعة الإيصال' : 'Print Receipt'}</span>
                    </button>
                    <Link
                        href={`/track-order?order_number=${order.order_number}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
                    >
                        <PackageSearch className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'تتبع الطلب' : 'Track Order'}</span>
                    </Link>
                    <Link
                        href="/catalog"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-xs"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t('continue_browsing')}</span>
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
}
