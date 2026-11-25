import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Phone, Printer, Tag, Truck } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import { useTranslation } from '@/lib/i18n';
import type { PageProps } from '@/types';

export default function OrderInvoice({ order }: { order: any }) {
    const { settings } = usePage<PageProps>().props;
    const { formatPrice, localized, locale, dir } = useTranslation();
    const addr = order.shipping_address || {};
    const primaryColor = settings.primary_color || '#0f766e';
    const isPaid = order.payment_status === 'paid';

    return (
        <div dir={dir} className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
            <Head title={`${locale === 'ar' ? 'فاتورة' : 'Invoice'} ${order.order_number}`} />

            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-5 flex items-center justify-between print:hidden">
                <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                    <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    <span>{locale === 'ar' ? 'العودة لتفاصيل الطلب' : 'Back to Order'}</span>
                </Link>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Printer className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
                </button>
            </div>

            {/* Invoice Sheet */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden print:rounded-none print:border-0 print:shadow-none">
                {/* Brand Accent Strip */}
                <div className="h-2.5 w-full" style={{ backgroundColor: primaryColor }} />

                <div className="p-8 sm:p-12 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
                        <div className="space-y-2">
                            <BrandLogo
                                variant="light"
                                size="lg"
                                customName={localized(settings.site_name || 'Sannafly', settings.site_name_ar)}
                            />
                            <p className="text-xs text-slate-400">
                                {locale === 'ar' ? 'فاتورة ضريبية / إيصال طلب' : 'Official Sales Invoice'}
                            </p>
                            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                                {settings.contact_email && <div>{settings.contact_email}</div>}
                                {settings.contact_phone && <div dir="ltr" className="inline-block">{settings.contact_phone}</div>}
                            </div>
                        </div>

                        <div className="sm:text-end space-y-2">
                            <div className="inline-flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                                        isPaid
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                >
                                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                    <span>{isPaid ? (locale === 'ar' ? 'مدفوعة' : 'PAID') : (locale === 'ar' ? 'غير مدفوعة' : 'UNPAID')}</span>
                                </span>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    {locale === 'ar' ? 'رقم الفاتورة' : 'INVOICE NO.'}
                                </div>
                                <div className="text-xl font-mono font-extrabold text-slate-900">{order.order_number}</div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {locale === 'ar' ? 'التاريخ:' : 'Issued:'}{' '}
                                <span className="font-semibold text-slate-700">
                                    {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Shipping Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {locale === 'ar' ? 'بيانات العميل' : 'Billed To'}
                            </div>
                            <div className="font-extrabold text-base text-slate-900">{order.customer_name}</div>
                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span dir="ltr">{order.customer_phone}</span>
                            </div>
                            {order.customer_email && <div className="text-xs text-slate-500">{order.customer_email}</div>}
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'عنوان التوصيل وطريقة الدفع' : 'Shipping & Payment'}</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800">
                                {addr.city || '—'}{addr.area ? `, ${addr.area}` : ''}
                            </div>
                            {addr.street && <div className="text-xs text-slate-600">{addr.street}</div>}
                            {(addr.building || addr.floor || addr.apartment) && (
                                <div className="text-[11px] text-slate-500">
                                    {[
                                        addr.building && `${locale === 'ar' ? 'مبنى' : 'Bldg'} ${addr.building}`,
                                        addr.floor && `${locale === 'ar' ? 'دور' : 'Fl'} ${addr.floor}`,
                                        addr.apartment && `${locale === 'ar' ? 'شقة' : 'Apt'} ${addr.apartment}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' • ')}
                                </div>
                            )}
                            <div className="text-[11px] text-slate-500 pt-1">
                                {locale === 'ar' ? 'الدفع:' : 'Method:'}{' '}
                                <strong className="text-slate-800">
                                    {localized(order.payment_method?.name, order.payment_method?.name_ar)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4 text-start">#</th>
                                    <th className="py-3.5 px-4 text-start">{locale === 'ar' ? 'المنتج' : 'Item'}</th>
                                    <th className="py-3.5 px-4 text-start">SKU</th>
                                    <th className="py-3.5 px-4 text-end">{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                                    <th className="py-3.5 px-4 text-end">{locale === 'ar' ? 'السعر' : 'Unit Price'}</th>
                                    <th className="py-3.5 px-4 text-end">{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items?.map((item: any, idx: number) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="py-3.5 px-4 text-xs text-slate-400">{idx + 1}</td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-900">{item.product_name}</td>
                                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{item.sku}</td>
                                        <td className="py-3.5 px-4 text-end font-semibold">{item.quantity}</td>
                                        <td className="py-3.5 px-4 text-end text-slate-600">{formatPrice(item.unit_price)}</td>
                                        <td className="py-3.5 px-4 text-end font-bold text-slate-900">{formatPrice(item.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="text-xs text-slate-500 space-y-1 max-w-sm">
                            {order.notes && (
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900">
                                    <strong>{locale === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> {order.notes}
                                </div>
                            )}
                            <p className="pt-2">
                                {locale === 'ar'
                                    ? 'شكراً لتسوقكم معنا! لأي استفسار يرجى التواصل مع خدمة العملاء برقم الطلب.'
                                    : 'Thank you for your business! Please quote your order number for any inquiries.'}
                            </p>
                        </div>

                        <div className="w-full sm:w-80 bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-2.5 text-sm">
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
                                <span>{locale === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                                <span style={{ color: primaryColor }}>{formatPrice(order.grand_total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
