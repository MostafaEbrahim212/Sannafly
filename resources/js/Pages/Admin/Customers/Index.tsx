import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Heart, MapPin, Search, ShieldBan, ShieldCheck, ShoppingBag, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function CustomersIndex({ customers, filters }: { customers: any; filters: { search?: string } }) {
    const { formatPrice, locale } = useTranslation();
    const [search, setSearch] = useState(filters?.search || '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/customers', search ? { search } : {}, { preserveState: true });
    };

    return (
        <AdminLayout title={locale === 'ar' ? 'العملاء المسجلون' : 'Registered Customers'}>
            <Head title="Customers" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <p className="text-sm text-slate-500">
                    {locale === 'ar'
                        ? 'عرض حسابات العملاء، الطلبات، إجمالي الإنفاق، وحالة الحساب'
                        : 'View registered storefront customers, order volume, and account status'}
                </p>

                <form onSubmit={applySearch} className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد أو الهاتف...' : 'Search name, email, phone...'}
                        className="ps-3.5 pe-9 py-2 rounded-xl border border-slate-300 bg-white text-sm w-72"
                    />
                    <button type="submit" className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'التواصل' : 'Contact'}</th>
                            <th className="p-3.5 text-center">{locale === 'ar' ? 'الطلبات' : 'Orders'}</th>
                            <th className="p-3.5 text-end">{locale === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}</th>
                            <th className="p-3.5 text-center">{locale === 'ar' ? 'العناوين / المفضلة' : 'Saved'}</th>
                            <th className="p-3.5 text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="p-3.5 text-end">{locale === 'ar' ? 'إجراء' : 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {customers.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400">
                                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <span>{locale === 'ar' ? 'لا يوجد عملاء مسجلون بعد' : 'No registered customers found.'}</span>
                                </td>
                            </tr>
                        ) : (
                            customers.data.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50/70">
                                    <td className="p-3.5">
                                        <Link href={`/admin/customers/${c.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-700 hover:underline">
                                            {c.name}
                                        </Link>
                                        <div className="text-[11px] text-slate-400">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-xs">
                                        <div>{c.email}</div>
                                        {c.phone && <div dir="ltr" className="text-slate-500 inline-block">{c.phone}</div>}
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
                                            <ShoppingBag className="w-3 h-3" />
                                            {c.orders_count}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-end font-extrabold text-teal-700">
                                        {formatPrice(c.total_spent || 0)}
                                    </td>
                                    <td className="p-3.5 text-center text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 me-2">
                                            <MapPin className="w-3 h-3" /> {c.addresses_count}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-rose-500" /> {c.wishlists_count}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}
                                        >
                                            {c.status === 'active'
                                                ? locale === 'ar' ? 'نشط' : 'Active'
                                                : locale === 'ar' ? 'موقوف' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-end">
                                        <div className="inline-flex items-center gap-2">
                                            <Link
                                                href={`/admin/customers/${c.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{locale === 'ar' ? 'التفاصيل' : 'View'}</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => router.put(`/admin/customers/${c.id}/toggle`, {}, { preserveScroll: true })}
                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                                                    c.status === 'active'
                                                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                }`}
                                            >
                                                {c.status === 'active' ? <ShieldBan className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                <span>
                                                    {c.status === 'active'
                                                        ? locale === 'ar' ? 'إيقاف' : 'Suspend'
                                                        : locale === 'ar' ? 'تفعيل' : 'Activate'}
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
