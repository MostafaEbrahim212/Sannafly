import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CreditCard,
    MapPin,
    Package,
    Phone,
    Printer,
    RotateCcw,
    Search,
    Truck,
    X,
    XCircle,
} from 'lucide-react';
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            placeholder={locale === 'ar' ? 'ابحث برقم الطلب أو العميل أو الهاتف...' : 'Search order #, customer, phone...'}
                            className="w-full ps-10 pe-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); applyFilter({ search: '' }); }}
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {locale === 'ar' ? `إجمالي الطلبات: ${totalCount}` : `Total Orders: ${totalCount}`}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => { setActiveStatus(''); applyFilter({ status: '' }); }}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                            activeStatus === ''
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-teal-600 dark:border-teal-600'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {locale === 'ar' ? 'الكل' : 'All'} ({totalCount})
                    </button>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => { setActiveStatus(key); applyFilter({ status: key }); }}
                            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                activeStatus === key
                                    ? 'bg-teal-700 text-white border-teal-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-500 text-sm">
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
                        const itemsCount = o.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;

                        return (
                            <div
                                key={o.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors overflow-hidden"
                            >
                                <div className="p-5 space-y-4">
                                    {/* Top Row: Order Identity + Price & Actions */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Order Info */}
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/admin/orders/${o.id}`}
                                                    className="font-mono font-extrabold text-teal-800 dark:text-teal-400 hover:underline text-base whitespace-nowrap"
                                                >
                                                    {o.order_number}
                                                </Link>
                                                <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${st.cls}`}>
                                                    {locale === 'ar' ? st.ar : st.en}
                                                </span>
                                                <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold ${pm.cls}`}>
                                                    {locale === 'ar' ? pm.ar : pm.en}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{o.customer_name}</span>
                                                {o.customer_phone && (
                                                    <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {o.customer_phone}
                                                    </span>
                                                )}
                                                {o.payment_method && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3 text-slate-400" />
                                                        {localized(o.payment_method.name, o.payment_method.name_ar)}
                                                    </span>
                                                )}
                                                {itemsCount > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Package className="w-3 h-3 text-slate-400" />
                                                        {itemsCount} {locale === 'ar' ? 'منتج' : itemsCount === 1 ? 'item' : 'items'}
                                                    </span>
                                                )}
                                                {o.created_at && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        {new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price + 1-Click Actions */}
                                        <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
                                            <span className="font-extrabold text-lg text-slate-900 dark:text-white whitespace-nowrap me-2">
                                                {formatPrice(o.grand_total)}
                                            </span>

                                            {primaryNext && nextAllowed.includes(primaryNext.next) && (
                                                <button
                                                    type="button"
                                                    onClick={() => changeStatus(o.id, primaryNext.next)}
                                                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
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
                                                    className="whitespace-nowrap inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>{locale === 'ar' ? 'تأكيد التحويل' : 'Mark Paid'}</span>
                                                </button>
                                            )}

                                            {nextAllowed.includes('returned') && (
                                                <button
                                                    type="button"
                                                    onClick={() => confirm(locale === 'ar' ? 'تسجيل الطلب كمرتجع وإعادة المخزون؟' : 'Mark as returned & restock?') && changeStatus(o.id, 'returned')}
                                                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>{locale === 'ar' ? 'مرتجع' : 'Return'}</span>
                                                </button>
                                            )}

                                            {nextAllowed.includes('refunded') && o.payment_status === 'paid' && (
                                                <button
                                                    type="button"
                                                    onClick={() => confirm(locale === 'ar' ? 'تأكيد استرداد المبلغ للعميل؟' : 'Mark payment refunded?') && changeStatus(o.id, 'refunded')}
                                                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <span>{locale === 'ar' ? 'استرداد مالي' : 'Refund'}</span>
                                                </button>
                                            )}

                                            {nextAllowed.includes('cancelled') && (
                                                <button
                                                    type="button"
                                                    onClick={() => confirm(locale === 'ar' ? 'إلغاء الطلب وإعادة المخزون؟' : 'Cancel order and release stock?') && changeStatus(o.id, 'cancelled')}
                                                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 transition-colors"
                                                    title={locale === 'ar' ? 'إلغاء الطلب' : 'Cancel'}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            <Link
                                                href={`/admin/orders/${o.id}/invoice`}
                                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                title={locale === 'ar' ? 'طباعة الفاتورة' : 'Invoice'}
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : o.id)}
                                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                title={locale === 'ar' ? 'عرض التفاصيل' : 'Toggle details'}
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual Pipeline (full width progress bar) */}
                                    {stepIdx >= 0 && (
                                        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800">
                                            <div className="grid grid-cols-5 gap-2">
                                                {PIPELINE.map((s, i) => {
                                                    const active = i <= stepIdx;
                                                    return (
                                                        <div key={s} className="space-y-1.5 min-w-0">
                                                            <div
                                                                className={`h-1.5 rounded-full transition-colors ${
                                                                    active ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`text-[11px] font-semibold text-center truncate ${
                                                                    active ? 'text-teal-800 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                                                                }`}
                                                            >
                                                                {locale === 'ar' ? STATUS_META[s].ar : STATUS_META[s].en}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="px-5 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <div className="font-bold text-slate-600 dark:text-slate-300 mb-2">{t('products')}</div>
                                            <div className="space-y-1.5">
                                                {o.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between gap-3 text-slate-700 dark:text-slate-300">
                                                        <span>
                                                            {item.product_name} <span className="text-slate-400">({item.sku})</span> × {item.quantity}
                                                        </span>
                                                        <span className="font-bold whitespace-nowrap">{formatPrice(item.total_price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                                                <span>{locale === 'ar' ? 'عنوان التوصيل' : 'Shipping Address'}</span>
                                            </div>
                                            {o.shipping_address?.street ? (
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    {o.shipping_address.street}
                                                    {o.shipping_address.area ? `, ${o.shipping_address.area}` : ''}, {o.shipping_address.city}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400">—</p>
                                            )}
                                            {o.notes && (
                                                <p className="text-slate-500 dark:text-slate-400 italic">
                                                    {locale === 'ar' ? 'ملاحظات:' : 'Notes:'} {o.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {orders.last_page > 1 && Array.isArray(orders.links) && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                    {orders.links.map((link: any, idx: number) => (
                        <Link
                            key={idx}
                            href={link.url || '#'}
                            preserveState
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                link.active
                                    ? 'bg-teal-700 text-white border-teal-700'
                                    : link.url
                                      ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 pointer-events-none'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
