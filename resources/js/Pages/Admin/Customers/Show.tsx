import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Heart, Mail, MapPin, Phone, ShieldBan, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function CustomerShow({
    customer,
    orders = [],
    addresses = [],
    wishlists = [],
}: {
    customer: any;
    orders: any[];
    addresses: any[];
    wishlists: any[];
}) {
    const { formatPrice, locale, localized } = useTranslation();
    const isAr = locale === 'ar';

    return (
        <AdminLayout title={`${isAr ? 'ملف العميل' : 'Customer'}: ${customer.name}`}>
            <Head title={customer.name} />

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/admin/customers"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                    <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                    <span>{isAr ? 'العودة لقائمة العملاء' : 'Back to Customers'}</span>
                </Link>

                <button
                    type="button"
                    onClick={() => router.put(`/admin/customers/${customer.id}/toggle`, {}, { preserveScroll: true })}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        customer.status === 'active'
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400'
                    }`}
                >
                    {customer.status === 'active' ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>
                        {customer.status === 'active'
                            ? isAr
                                ? 'إيقاف الحساب'
                                : 'Suspend Account'
                            : isAr
                              ? 'تفعيل الحساب'
                              : 'Activate Account'}
                    </span>
                </button>
            </div>

            {/* Profile & KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-lg truncate">{customer.name}</h2>
                            <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    customer.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                            >
                                {customer.status === 'active' ? (isAr ? 'نشط' : 'Active') : isAr ? 'موقوف' : 'Suspended'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span dir="ltr">{customer.phone}</span>
                            </div>
                        )}
                        <div className="text-slate-400 pt-1">
                            {isAr ? 'تاريخ التسجيل:' : 'Joined:'} {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'الطلبات' : 'Orders'}</div>
                        <div className="text-2xl font-extrabold mt-1">{customer.orders_count ?? orders.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'إجمالي الإنفاق' : 'Total Spent'}</div>
                        <div className="text-xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
                            {formatPrice(customer.total_spent || 0)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'العناوين' : 'Addresses'}</div>
                        <div className="text-2xl font-extrabold mt-1">{customer.addresses_count ?? addresses.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="text-xs text-slate-500">{isAr ? 'المفضلة' : 'Wishlist'}</div>
                        <div className="text-2xl font-extrabold mt-1">{customer.wishlists_count ?? wishlists.length}</div>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 font-bold text-sm">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    <span>{isAr ? 'سجل الطلبات' : 'Order History'}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="p-3.5 text-start">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                                <th className="p-3.5 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                                <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                                <th className="p-3.5 text-center">{isAr ? 'الدفع' : 'Payment'}</th>
                                <th className="p-3.5 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                                        {isAr ? 'لا توجد طلبات لهذا العميل بعد' : 'No orders placed by this customer yet.'}
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="p-3.5 font-mono font-bold">
                                            <Link href={`/admin/orders/${o.id}`} className="text-teal-700 dark:text-teal-400 hover:underline">
                                                {o.order_number}
                                            </Link>
                                        </td>
                                        <td className="p-3.5 text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td className="p-3.5 text-center text-xs font-semibold capitalize">{o.status}</td>
                                        <td className="p-3.5 text-center text-xs font-semibold capitalize">{o.payment_status}</td>
                                        <td className="p-3.5 text-end font-bold">{formatPrice(o.grand_total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Addresses & Wishlists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span>{isAr ? 'العناوين المحفوظة' : 'Saved Addresses'}</span>
                    </div>
                    {addresses.length === 0 ? (
                        <p className="text-xs text-slate-400">{isAr ? 'لا توجد عناوين محفوظة' : 'No saved addresses.'}</p>
                    ) : (
                        <div className="space-y-2">
                            {addresses.map((a) => (
                                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-0.5">
                                    <div className="font-bold">
                                        {a.label || a.city} {a.is_default ? `(${isAr ? 'افتراضي' : 'Default'})` : ''}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300">
                                        {a.city}
                                        {a.area ? ` — ${a.area}` : ''} — {a.street}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>{isAr ? 'قائمة المفضلة' : 'Wishlist Items'}</span>
                    </div>
                    {wishlists.length === 0 ? (
                        <p className="text-xs text-slate-400">{isAr ? 'لا توجد منتجات في المفضلة' : 'No wishlist items.'}</p>
                    ) : (
                        <div className="space-y-2">
                            {wishlists.map((w) => (
                                <div key={w.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                                    <span className="font-semibold">
                                        {w.product ? localized(w.product.name, w.product.name_ar) : `#${w.product_id}`}
                                    </span>
                                    {w.product?.sku && <span className="font-mono text-slate-400">{w.product.sku}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
