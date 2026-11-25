import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, MapPin, Package, Printer, RotateCcw, Tag, Truck, User, XCircle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

const STATUS_META: Record<string, { en: string; ar: string; cls: string }> = {
    pending: { en: 'Pending', ar: 'قيد الانتظار', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
    processing: { en: 'Processing', ar: 'قيد التجهيز', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    shipped: { en: 'Shipped', ar: 'تم الشحن', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
    delivered: { en: 'Delivered', ar: 'تم التسليم', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    returned: { en: 'Returned', ar: 'مرتجع', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
    cancelled: { en: 'Cancelled', ar: 'ملغي', cls: 'bg-red-50 text-red-700 border-red-200' },
    refunded: { en: 'Refunded', ar: 'مسترد', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const PIPELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderShow({ order, allowedTransitions }: { order: any; allowedTransitions: Record<string, string[]> }) {
    const { formatPrice, locale, localized, dir } = useTranslation();
    const nextStatuses = allowedTransitions[order.status] || [];
    const addr = order.shipping_address || {};
    const stepIdx = PIPELINE.indexOf(order.status);
    const st = STATUS_META[order.status] || { en: order.status, ar: order.status, cls: 'bg-slate-100 text-slate-700' };

    const updateStatus = (status: string, paymentStatus?: string) => {
        router.put(`/admin/orders/${order.id}/status`, { status, payment_status: paymentStatus }, { preserveScroll: true });
    };

    return (
        <AdminLayout title={`${locale === 'ar' ? 'تفاصيل الطلب' : 'Order'} #${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Top Navigation + Print */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-semibold">
                        <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        <span>{locale === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/orders/${order.id}/invoice`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{locale === 'ar' ? 'عرض وطباعة الفاتورة' : 'View & Print Invoice'}</span>
                        </Link>
                    </div>
                </div>

                {/* Hero Order Header & Pipeline */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono font-extrabold text-xl text-teal-800">{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${st.cls}`}>
                                    {locale === 'ar' ? st.ar : st.en}
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                                    }`}
                                >
                                    {order.payment_status === 'paid' ? (locale === 'ar' ? 'مدفوع' : 'Paid') : (locale === 'ar' ? 'غير مدفوع' : order.payment_status)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {locale === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'} {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>

                        <div className="text-end">
                            <div className="text-xs text-slate-400">{locale === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</div>
                            <div className="text-2xl font-extrabold text-teal-700">{formatPrice(order.grand_total)}</div>
                        </div>
                    </div>

                    {/* Visual Pipeline */}
                    {stepIdx >= 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <div className="grid grid-cols-5 gap-2">
                                {PIPELINE.map((s, i) => {
                                    const active = i <= stepIdx;
                                    return (
                                        <div key={s} className="space-y-1.5">
                                            <div className={`h-2 rounded-full transition-colors ${active ? 'bg-teal-600' : 'bg-slate-100'}`} />
                                            <div className={`text-[11px] font-bold text-center ${active ? 'text-teal-800' : 'text-slate-400'}`}>
                                                {locale === 'ar' ? STATUS_META[s].ar : STATUS_META[s].en}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Controls */}
                    {(nextStatuses.length > 0 || order.payment_status === 'unpaid') && (
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 me-1">{locale === 'ar' ? 'إجراءات سريعة:' : 'Quick Actions:'}</span>
                            {nextStatuses.map((next) => {
                                const meta = STATUS_META[next];
                                const isCancel = next === 'cancelled';
                                const isReturn = next === 'returned';
                                return (
                                    <button
                                        key={next}
                                        type="button"
                                        onClick={() => updateStatus(next)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                            isCancel
                                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                : isReturn
                                                ? 'border-orange-200 text-orange-700 hover:bg-orange-50'
                                                : 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                                        }`}
                                    >
                                        {isCancel ? <XCircle className="w-3.5 h-3.5" /> : isReturn ? <RotateCcw className="w-3.5 h-3.5" /> : <ArrowRight className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />}
                                        <span>{locale === 'ar' ? meta?.ar || next : meta?.en || next}</span>
                                    </button>
                                );
                            })}

                            {order.payment_status === 'unpaid' && !['cancelled', 'refunded'].includes(order.status) && (
                                <button
                                    type="button"
                                    onClick={() => updateStatus(order.status, 'paid')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{locale === 'ar' ? 'تأكيد الدفع' : 'Mark as Paid'}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-2">
                        <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'بيانات العميل' : 'Customer'}</span>
                        </div>
                        <div className="font-bold text-base">{order.customer_name}</div>
                        <div dir="ltr" className="text-xs text-slate-600 inline-block">{order.customer_phone}</div>
                        {order.customer_email && <div className="text-xs text-slate-500">{order.customer_email}</div>}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-2">
                        <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}</span>
                        </div>
                        <div className="text-sm font-semibold">{addr.city || '—'}{addr.area ? `, ${addr.area}` : ''}</div>
                        <div className="text-xs text-slate-600">{addr.street || '—'}</div>
                        {(addr.building || addr.floor || addr.apartment) && (
                            <div className="text-xs text-slate-500">
                                {[addr.building && `Bldg ${addr.building}`, addr.floor && `Fl ${addr.floor}`, addr.apartment && `Apt ${addr.apartment}`].filter(Boolean).join(' • ')}
                            </div>
                        )}
                        {order.shipping_zone_name && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                                <Truck className="w-3 h-3" />
                                <span>{order.shipping_zone_name}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-2">
                        <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'الدفع والخصم' : 'Payment & Coupon'}</span>
                        </div>
                        <div className="text-sm font-bold">{localized(order.payment_method?.name, order.payment_method?.name_ar)}</div>
                        {order.payments?.[0]?.transaction_reference && (
                            <div className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border">
                                Ref: {order.payments[0].transaction_reference}
                            </div>
                        )}
                        {order.coupon_code && (
                            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                <Tag className="w-3.5 h-3.5" />
                                <span>{order.coupon_code} (-{formatPrice(order.discount_total)})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items & Totals */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
                    <div className="p-5 border-b flex items-center gap-2 font-bold text-sm">
                        <Package className="w-4 h-4 text-teal-700" />
                        <span>{locale === 'ar' ? 'المنتجات المطلوبة' : 'Order Items'} ({order.items?.length || 0})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                                <tr>
                                    <th className="p-3.5 text-start">{locale === 'ar' ? 'المنتج' : 'Item'}</th>
                                    <th className="p-3.5 text-start">SKU</th>
                                    <th className="p-3.5 text-end">{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                                    <th className="p-3.5 text-end">{locale === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                                    <th className="p-3.5 text-end">{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {order.items?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="p-3.5 font-semibold">{item.product_name}</td>
                                        <td className="p-3.5 font-mono text-xs text-slate-500">{item.sku}</td>
                                        <td className="p-3.5 text-end">{item.quantity}</td>
                                        <td className="p-3.5 text-end">{formatPrice(item.unit_price)}</td>
                                        <td className="p-3.5 text-end font-bold">{formatPrice(item.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-5 bg-slate-50 border-t flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="text-xs text-slate-500">
                            {order.notes && (
                                <p className="italic">
                                    <strong>{locale === 'ar' ? 'ملاحظات العميل:' : 'Customer Notes:'}</strong> {order.notes}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5 text-sm w-full sm:w-72">
                            <div className="flex justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            {parseFloat(order.discount_total) > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                    <span>{locale === 'ar' ? 'الخصم' : 'Discount'} {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                                    <span>-{formatPrice(order.discount_total)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>{locale === 'ar' ? 'الشحن' : 'Shipping'}</span>
                                <span>{parseFloat(order.shipping_total) === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatPrice(order.shipping_total)}</span>
                            </div>
                            <div className="flex justify-between font-extrabold text-base pt-2 border-t">
                                <span>{locale === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                                <span className="text-teal-700">{formatPrice(order.grand_total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
