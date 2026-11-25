import React from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart3, Download, DollarSign, ShoppingBag, TrendingUp, Truck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

interface AnalyticsProps {
    days: number;
    summary: {
        order_count: number;
        total_revenue: string;
        paid_revenue: string;
        avg_order_value: string;
        total_discount: string;
        total_shipping: string;
    };
    topProducts: Array<{ sku: string; product_name: string; total_qty: number; total_sales: string }>;
    byPaymentMethod: Array<{ name: string | null; name_ar: string | null; driver: string | null; orders_count: number; total_amount: string }>;
}

export default function AnalyticsIndex({ days, summary, topProducts, byPaymentMethod }: AnalyticsProps) {
    const { locale, formatPrice, localized } = useTranslation();

    const changeDays = (nextDays: number) => {
        router.get('/admin/analytics', { days: nextDays }, { preserveState: true });
    };

    return (
        <AdminLayout title={locale === 'ar' ? 'تحليلات المبيعات' : 'Sales Analytics'}>
            <Head title={locale === 'ar' ? 'تحليلات المبيعات' : 'Sales Analytics'} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {[7, 30, 90, 365].map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => changeDays(d)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                                    days === d
                                        ? 'bg-teal-700 text-white border-teal-700'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                                }`}
                            >
                                {d} {locale === 'ar' ? 'يوم' : 'Days'}
                            </button>
                        ))}
                    </div>

                    <a
                        href={`/admin/analytics/export?days=${days}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                    >
                        <Download className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>{locale === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
                            <DollarSign className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900">{formatPrice(summary.total_revenue)}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                            {locale === 'ar' ? 'المدفوع فعلياً:' : 'Collected:'} {formatPrice(summary.paid_revenue)}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>{locale === 'ar' ? 'عدد الطلبات' : 'Orders'}</span>
                            <ShoppingBag className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900">{summary.order_count}</div>
                        <div className="text-[11px] text-slate-500">
                            {locale === 'ar' ? 'متوسط الطلب:' : 'AOV:'} {formatPrice(summary.avg_order_value)}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>{locale === 'ar' ? 'إجمالي الخصومات' : 'Discounts Given'}</span>
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900">{formatPrice(summary.total_discount)}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>{locale === 'ar' ? 'رسوم الشحن' : 'Shipping Collected'}</span>
                            <Truck className="w-4 h-4 text-sky-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900">{formatPrice(summary.total_shipping)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-teal-600" />
                            <span>{locale === 'ar' ? 'الأكثر مبيعاً' : 'Top Selling Products'}</span>
                        </h3>
                        <div className="divide-y text-sm">
                            {topProducts.length === 0 ? (
                                <p className="text-slate-400 text-xs py-6 text-center">{locale === 'ar' ? 'لا توجد مبيعات في هذه الفترة' : 'No sales in this period.'}</p>
                            ) : (
                                topProducts.map((p) => (
                                    <div key={p.sku} className="py-2.5 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-800">{p.product_name}</div>
                                            <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="font-bold text-teal-700">{formatPrice(p.total_sales)}</div>
                                            <div className="text-[11px] text-slate-500">{p.total_qty} {locale === 'ar' ? 'قطعة' : 'sold'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="font-bold text-sm mb-4">{locale === 'ar' ? 'المبيعات حسب طريقة الدفع' : 'By Payment Method'}</h3>
                        <div className="divide-y text-sm">
                            {byPaymentMethod.length === 0 ? (
                                <p className="text-slate-400 text-xs py-6 text-center">{locale === 'ar' ? 'لا توجد بيانات' : 'No data.'}</p>
                            ) : (
                                byPaymentMethod.map((m, idx) => (
                                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-slate-800">{localized(m.name || m.driver || 'Other', m.name_ar)}</div>
                                            <div className="text-[11px] text-slate-400">{m.orders_count} {locale === 'ar' ? 'طلب' : 'orders'}</div>
                                        </div>
                                        <div className="font-bold text-slate-900">{formatPrice(m.total_amount)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
