import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Boxes,
    FileSpreadsheet,
    FolderTree,
    MessageSquare,
    Package,
    Plus,
    Printer,
    ShoppingBag,
    Sparkles,
    Tag,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import type { PageProps } from '@/types';

interface DashboardProps {
    stats: {
        total_products: number;
        published_products: number;
        draft_products: number;
        low_stock_count: number;
        categories_count: number;
        brands_count: number;
        orders_count: number;
        pending_orders: number;
    };
    lowStockProducts: any[];
    recentProducts: any[];
    recentActivity: any[];
    recentImports: any[];
    recentInquiries: any[];
    categoryBreakdown: any[];
}

export default function Dashboard({ stats, lowStockProducts, recentProducts, recentActivity, recentInquiries, categoryBreakdown }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const { t, localized, can, locale, settings } = useTranslation();

    const publishRatio = stats.total_products > 0 ? Math.round((stats.published_products / stats.total_products) * 100) : 0;

    const kpis = [
        {
            label: t('products'),
            value: stats.total_products,
            sub: `${stats.published_products} ${t('published')} • ${stats.draft_products} ${t('draft')}`,
            icon: Package,
            gradient: 'from-teal-500 to-emerald-600',
            bgLight: 'bg-teal-50 text-teal-700',
            progress: publishRatio,
        },
        {
            label: t('low_stock'),
            value: stats.low_stock_count,
            sub: t('needs_attention'),
            icon: AlertTriangle,
            gradient: 'from-amber-500 to-orange-600',
            bgLight: 'bg-amber-50 text-amber-700',
            progress: stats.total_products > 0 ? Math.min(100, Math.round((stats.low_stock_count / stats.total_products) * 100)) : 0,
        },
        {
            label: t('categories'),
            value: stats.categories_count,
            sub: `${stats.brands_count} ${t('brands')}`,
            icon: FolderTree,
            gradient: 'from-indigo-500 to-violet-600',
            bgLight: 'bg-indigo-50 text-indigo-700',
            progress: 100,
        },
        ...(settings.module_ecommerce
            ? [
                  {
                      label: t('orders'),
                      value: stats.orders_count,
                      sub: `${stats.pending_orders} ${t('pending')}`,
                      icon: ShoppingBag,
                      gradient: 'from-sky-500 to-blue-600',
                      bgLight: 'bg-sky-50 text-sky-700',
                      progress: stats.orders_count > 0 ? Math.round(((stats.orders_count - stats.pending_orders) / stats.orders_count) * 100) : 100,
                  },
              ]
            : [
                  {
                      label: t('brands'),
                      value: stats.brands_count,
                      sub: t('active_brands'),
                      icon: Tag,
                      gradient: 'from-sky-500 to-blue-600',
                      bgLight: 'bg-sky-50 text-sky-700',
                      progress: 100,
                  },
              ]),
    ];

    const quickActions = [
        can('products.create') && { label: locale === 'ar' ? 'إضافة منتج' : 'Add Product', href: '/admin/products/create', icon: Plus, color: 'bg-teal-700 text-white hover:bg-teal-800' },
        can('products.import') && { label: t('import_export'), href: '/admin/import-export', icon: FileSpreadsheet, color: 'bg-white text-slate-700 border hover:bg-slate-50' },
        can('products.print') && { label: t('print_catalog'), href: '/admin/print/catalog', icon: Printer, color: 'bg-white text-slate-700 border hover:bg-slate-50' },
    ].filter(Boolean) as Array<{ label: string; href: string; icon: any; color: string }>;

    return (
        <AdminLayout title={t('dashboard')}>
            <Head title={t('dashboard')} />

            {/* Welcome Hero Banner */}
            <div className="mb-7 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-medium mb-2.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{settings.site_name || 'CatalogFlow'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                        {locale === 'ar' ? `مرحباً، ${auth.user?.name}` : `Welcome back, ${auth.user?.name}`}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                        {locale === 'ar'
                            ? `لديك ${stats.total_products} منتجاً في الكتالوج (${publishRatio}% منشور).`
                            : `You have ${stats.total_products} products in your catalog (${publishRatio}% published).`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {quickActions.map((qa) => {
                        const Icon = qa.icon;
                        return (
                            <Link
                                key={qa.href}
                                href={qa.href}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${qa.color}`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{qa.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
                {kpis.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div
                            key={c.label}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</div>
                                    <div className="text-3xl font-extrabold mt-1.5 tracking-tight">{c.value}</div>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-sm`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                                    <span>{c.sub}</span>
                                    <span className="font-semibold">{c.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${c.gradient}`}
                                        style={{ width: `${Math.max(6, c.progress)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Products (2 cols on lg) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Package className="w-4 h-4 text-teal-600" />
                            <span>{t('recent_products')}</span>
                        </h3>
                        <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
                            <span>{t('manage')}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentProducts.map((p) => {
                            const thumb = p.images?.[0]?.thumbnail_path || p.images?.[0]?.path;
                            return (
                                <Link
                                    key={p.id}
                                    href={`/admin/products/${p.id}/edit`}
                                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0">
                                            {thumb ? (
                                                <img src={`/storage/${thumb}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm truncate">{localized(p.name, p.name_ar)}</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {p.sku} • {localized(p.category?.name, p.category?.name_ar) || '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            {p.stock_quantity} {t('stock')}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                p.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {t(p.status, p.status)}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Low Stock + Categories + Inquiries + Activity */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Boxes className="w-4 h-4 text-amber-600" />
                                <span>{t('low_stock')}</span>
                            </h3>
                            <Link href="/admin/inventory?low_stock=1" className="text-xs font-semibold text-teal-700 hover:underline">
                                {t('view_all')}
                            </Link>
                        </div>
                        <div className="space-y-2.5">
                            {lowStockProducts.length === 0 ? (
                                <p className="text-xs text-slate-500 py-4 text-center">{t('all_well_stocked')}</p>
                            ) : (
                                lowStockProducts.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/admin/products/${p.id}/edit`}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-xs truncate">{localized(p.name, p.name_ar)}</div>
                                            <div className="text-[11px] font-mono text-slate-500">{p.sku}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                            {p.stock_quantity} {t('left')}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <FolderTree className="w-4 h-4 text-teal-600" />
                                <span>{locale === 'ar' ? 'توزيع المنتجات حسب الأقسام' : 'Products by Category'}</span>
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {categoryBreakdown.map((cat) => {
                                const pct = stats.total_products > 0 ? Math.round((cat.products_count / stats.total_products) * 100) : 0;
                                return (
                                    <div key={cat.id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold">{localized(cat.name, cat.name_ar)}</span>
                                            <span className="text-slate-500">{cat.products_count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(4, pct)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-sky-600" />
                                <span>{t('inquiries')}</span>
                            </h3>
                            <Link href="/admin/inquiries" className="text-xs font-semibold text-teal-700 hover:underline">
                                {t('view_all')}
                            </Link>
                        </div>
                        <div className="space-y-2.5 text-xs">
                            {recentInquiries.length === 0 ? (
                                <p className="text-slate-500 text-center py-2">{locale === 'ar' ? 'لا توجد استفسارات بعد.' : 'No inquiries yet.'}</p>
                            ) : (
                                recentInquiries.map((inq) => (
                                    <div key={inq.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between font-semibold">
                                            <span>{inq.name}</span>
                                            <span className="text-[10px] uppercase text-teal-700">{inq.status}</span>
                                        </div>
                                        <p className="text-slate-500 line-clamp-1 mt-0.5">{inq.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" />
                                <span>{t('recent_activity')}</span>
                            </h3>
                            <Link href="/admin/audit-logs" className="text-xs font-semibold text-teal-700 hover:underline">
                                {t('logs')}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.slice(0, 6).map((a) => (
                                <div key={a.id} className="flex items-start gap-2.5 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="font-semibold">{a.actor_name}</span>{' '}
                                        <span className="text-slate-500 font-mono">{a.action}</span>
                                        <div className="text-[11px] text-slate-400">
                                            {a.resource_type} {a.resource_id ? `#${a.resource_id}` : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
