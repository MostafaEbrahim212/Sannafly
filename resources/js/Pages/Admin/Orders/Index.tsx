import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, MapPin, Printer, RotateCcw, Search, Truck, XCircle } from 'lucide-react';
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

const PAYMENT_META: Record<string, { en: string; ar: string; cls: string }> = {
    unpaid: { en: 'Unpaid', ar: 'غير مدفوع', cls: 'bg-slate-100 text-slate-700' },
    paid: { en: 'Paid', ar: 'مدفوع', cls: 'bg-emerald-100 text-emerald-800' },
    failed: { en: 'Failed', ar: 'فشل الدفع', cls: 'bg-red-100 text-red-700' },
    refunded: { en: 'Refunded', ar: 'مسترد', cls: 'bg-amber-100 text-amber-800' },
};

const HAPPY_PATH_NEXT: Record<string, { next: string; en: string; ar: string }> = {
    pending: { next: 'confirmed', en: 'Confirm Order', ar: 'تأكيد الطلب' },
    confirmed: { next: 'processing', en: 'Start Preparing', ar: 'بدء التجهيز' },
    processing: { next: 'shipped', en: 'Ship Order', ar: 'شحن الطلب' },
    shipped: { next: 'delivered', en: 'Mark Delivered', ar: 'تم التسليم' },
};

const PIPELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrdersIndex({
    orders,
    statusCounts = {},
    allowedTransitions,
    filters,
}: {
    orders: any;
    statusCounts?: Record<string, number>;
    allowedTransitions: Record<string, string[]>;
    filters?: Record<string, any>;
}) {
    const { t, formatPrice, locale, localized, dir } = useTranslation();
    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [activeStatus, setActiveStatus] = useState(typeof filters?.status === 'string' ? filters.status : '');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const applyFilter = (overrides: Record<string, any> = {}) => {
        router.get('/admin/orders', { search, status: activeStatus, ...overrides }, { preserveState: true });
    };

    const changeStatus = (orderId: number, status: string, paymentStatus?: string) => {
        router.put(
            `/admin/orders/${orderId}/status`,
            {
                status,
                ...(paymentStatus ? { payment_status: paymentStatus } : {}),
            },
            { preserveScroll: true }
        );
    };

    const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return (
        <AdminLayout title={t('orders')}>
            <Head title={t('orders')} />

            {/* Search + Status Filter Tabs */}
            <div className="space-y-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            placeholder={locale === 'ar' ? 'ابحث برقم الطلب أو العميل أو الهاتف...' : 'Search order #, customer, phone...'}
                            className="ps-3.5 pe-9 py-2 rounded-xl border border-slate-300 bg-white text-sm w-72"
                        />
                        <button onClick={() => applyFilter()} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => { setActiveStatus(''); applyFilter({ status: '' }); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            activeStatus === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {locale === 'ar' ? 'الكل' : 'All'} ({totalCount})
                    </button>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => { setActiveStatus(key); applyFilter({ status: key }); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                activeStatus === key ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {locale === 'ar' ? meta.ar : meta.en} ({statusCounts[key] || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {orders.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border p-12 text-center text-slate-500 text-sm">
                        {locale === 'ar' ? 'لا توجد طلبات مطابقة.' : 'No orders found.'}
                    </div>
                ) : (
                    orders.data.map((o: any) => {
                        const st = STATUS_META[o.status] || { en: o.status, ar: o.status, cls: 'bg-slate-100 text-slate-700' };
                        const pm = PAYMENT_META[o.payment_status] || { en: o.payment_status, ar: o.payment_status, cls: 'bg-slate-100 text-slate-700' };
                        const nextAllowed = allowedTransitions[o.status] || [];
                        const primaryNext = HAPPY_PATH_NEXT[o.status];
                        const stepIdx = PIPELINE.indexOf(o.status);
                        const isExpanded = expandedId === o.id;

                        return (
                            <div key={o.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Order Info */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/orders/${o.id}`} className="font-mono font-extrabold text-teal-800 hover:underline text-base">
                                                    {o.order_number}
                                                </Link>
                                                <Link
                                                    href={`/admin/orders/${o.id}/invoice`}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                    title={locale === 'ar' ? 'الفاتورة' : 'Invoice'}
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </Link>
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${st.cls}`}>
                                                    {locale === 'ar' ? st.ar : st.en}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${pm.cls}`}>
                                                    {locale === 'ar' ? pm.ar : pm.en}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                <strong className="text-slate-800">{o.customer_name}</strong> • {o.customer_phone} •{' '}
                                                {localized(o.payment_method?.name, o.payment_method?.name_ar)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Pipeline (for active flow) */}
                                    {stepIdx >= 0 && (
                                        <div className="hidden xl:flex items-center gap-1.5">
                                            {PIPELINE.map((s, i) => (
                                                <React.Fragment key={s}>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                            i <= stepIdx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}
                                                    >
                                                        {locale === 'ar' ? STATUS_META[s].ar : STATUS_META[s].en}
                                                    </span>
                                                    {i < PIPELINE.length - 1 && <span className="text-slate-300 text-xs">•</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}

                                    {/* Price + 1-Click Actions */}
                                    <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
                                        <span className="font-extrabold text-lg text-slate-900 me-2">{formatPrice(o.grand_total)}</span>

                                        {primaryNext && nextAllowed.includes(primaryNext.next) && (
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(o.id, primaryNext.next)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
                                            >
                                                <Truck className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? primaryNext.ar : primaryNext.en}</span>
                                                <ArrowRight className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}

                                        {o.payment_status === 'unpaid' && !['cancelled', 'refunded'].includes(o.status) && !['cod', 'cash'].includes(o.payment_method?.driver) && (
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(o.id, o.status, 'paid')}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'تأكيد التحويل' : 'Mark Paid'}</span>
                                            </button>
                                        )}

                                        {nextAllowed.includes('returned') && (
                                            <button
                                                type="button"
                                                onClick={() => confirm(locale === 'ar' ? 'تسجيل الطلب كمرتجع وإعادة المخزون؟' : 'Mark as returned & restock?') && changeStatus(o.id, 'returned')}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-xs font-semibold hover:bg-orange-100"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'مرتجع' : 'Return'}</span>
                                            </button>
                                        )}

                                        {nextAllowed.includes('refunded') && o.payment_status === 'paid' && (
                                            <button
                                                type="button"
                                                onClick={() => confirm(locale === 'ar' ? 'تأكيد استرداد المبلغ للعميل؟' : 'Mark payment refunded?') && changeStatus(o.id, 'refunded')}
                                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold hover:bg-slate-200"
                                            >
                                                <span>{locale === 'ar' ? 'استرداد مالي' : 'Refund'}</span>
                                            </button>
                                        )}

                                        {nextAllowed.includes('cancelled') && (
                                            <button
                                                type="button"
                                                onClick={() => confirm(locale === 'ar' ? 'إلغاء الطلب وإعادة المخزون؟' : 'Cancel order and release stock?') && changeStatus(o.id, 'cancelled')}
                                                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                                                title={locale === 'ar' ? 'إلغاء الطلب' : 'Cancel'}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(isExpanded ? null : o.id)}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <div className="font-bold text-slate-600 mb-2">{t('products')}</div>
                                            <div className="space-y-1">
                                                {o.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between">
                                                        <span>{item.product_name} ({item.sku}) × {item.quantity}</span>
                                                        <span className="font-bold">{formatPrice(item.total_price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="font-bold text-slate-600 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                                                <span>{locale === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}</span>
                                            </div>
                                            {o.shipping_address?.street ? (
                                                <p className="text-slate-600">
                                                    {o.shipping_address.street}
                                                    {o.shipping_address.area ? `, ${o.shipping_address.area}` : ''}, {o.shipping_address.city}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400">—</p>
                                            )}
                                            {o.notes && <p className="text-slate-500 italic">Notes: {o.notes}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </AdminLayout>
    );
}
