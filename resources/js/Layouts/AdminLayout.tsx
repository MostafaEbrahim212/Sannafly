import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Bell,
    Boxes,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    FolderTree,
    Globe,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
    Package,
    Paintbrush,
    Percent,
    Plus,
    Printer,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    ShoppingBag,
    Sliders,
    Sparkles,
    Star,
    Store,
    Tag,
    Truck,
    Users,
    Wrench,
    X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useColorMode } from '@/lib/colorMode';
import { applyThemeSettings } from '@/lib/theme';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import type { PageProps } from '@/types';

interface AdminLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
    const { auth, flash, settings } = usePage<PageProps>().props;
    const { t, can, locale, dir } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const adminAlerts = (usePage<PageProps>().props as any).adminAlerts as
        | { total: number; pending_orders: number; review_orders: number; low_stock: number }
        | null
        | undefined;
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('cf_sidebar_collapsed') === '1';
    });
    const [navQuery, setNavQuery] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const { mode, isDark, setMode } = useColorMode();

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = locale;
    }, [dir, locale]);

    useEffect(() => {
        applyThemeSettings(settings);
    }, [isDark, settings.primary_color, settings.accent_color, settings.text_color, settings.theme_surface, settings.border_radius]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cf_sidebar_collapsed', collapsed ? '1' : '0');
        }
    }, [collapsed]);

    const toggleGroup = (key: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const navGroups = [
        {
            key: 'catalog',
            title: locale === 'ar' ? 'الرئيسية والكتالوج' : 'Overview & Catalog',
            items: [
                { label: t('dashboard'), href: '/admin', icon: LayoutDashboard, perm: 'dashboard.access' },
                { label: t('products'), href: '/admin/products', icon: Package, perm: 'products.view' },
                { label: t('categories'), href: '/admin/categories', icon: FolderTree, perm: 'categories.view' },
                { label: t('brands'), href: '/admin/brands', icon: Tag, perm: 'brands.manage' },
                { label: t('attributes'), href: '/admin/attributes', icon: Sliders, perm: 'products.edit' },
                { label: t('inventory'), href: '/admin/inventory', icon: Boxes, perm: 'inventory.view' },
            ],
        },
        {
            key: 'operations',
            title: locale === 'ar' ? 'العمليات والمبيعات' : 'Operations & Sales',
            items: [
                ...(settings.module_ecommerce
                    ? [
                          { label: t('orders'), href: '/admin/orders', icon: ShoppingBag, perm: 'orders.view' },
                          { label: locale === 'ar' ? 'تحليلات المبيعات' : 'Analytics', href: '/admin/analytics', icon: BarChart3, perm: 'orders.view' },
                          { label: locale === 'ar' ? 'العملاء' : 'Customers', href: '/admin/customers', icon: Users, perm: 'orders.view' },
                          { label: locale === 'ar' ? 'الكوبونات' : 'Coupons', href: '/admin/coupons', icon: Percent, perm: 'orders.manage' },
                          { label: locale === 'ar' ? 'مناطق الشحن' : 'Shipping Zones', href: '/admin/shipping-zones', icon: Truck, perm: 'settings.manage' },
                          { label: t('payment_methods'), href: '/admin/payment-methods', icon: CreditCard, perm: 'payments.manage' },
                      ]
                    : []),
                { label: locale === 'ar' ? 'التقييمات' : 'Reviews', href: '/admin/reviews', icon: Star, perm: 'products.edit' },
                { label: t('inquiries'), href: '/admin/inquiries', icon: MessageSquare, perm: 'inquiries.manage' },
                { label: t('import_export'), href: '/admin/import-export', icon: FileSpreadsheet, perm: 'products.import' },
                { label: t('print_catalog'), href: '/admin/print/catalog', icon: Printer, perm: 'products.print' },
            ],
        },
        {
            key: 'system',
            title: locale === 'ar' ? 'النظام والأمان' : 'System & Security',
            items: [
                { label: t('users'), href: '/admin/users', icon: Users, perm: 'users.view' },
                { label: t('roles'), href: '/admin/roles', icon: Shield, perm: 'users.manage_roles' },
                { label: t('audit_logs'), href: '/admin/audit-logs', icon: Activity, perm: 'audit_logs.view' },
                { label: locale === 'ar' ? 'سجلات النظام' : 'System Logs', href: '/admin/system-logs', icon: FileText, perm: 'audit_logs.view' },
                { label: locale === 'ar' ? 'أدوات الصيانة والباك اب' : 'System Tools', href: '/admin/system-tools', icon: Wrench, perm: 'settings.manage' },
                { label: t('customizer'), href: '/admin/customizer', icon: Paintbrush, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'السياسات والصفحات' : 'Policies & Pages', href: '/admin/policies', icon: ShieldCheck, perm: 'settings.manage' },
                { label: t('settings'), href: '/admin/settings', icon: Settings, perm: 'settings.view' },
            ],
        },
    ]
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    can(item.perm) &&
                    (!navQuery.trim() || item.label.toLowerCase().includes(navQuery.trim().toLowerCase()))
            ),
        }))
        .filter((group) => group.items.length > 0);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div dir={dir} className="min-h-screen flex bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`no-print fixed inset-y-0 start-0 z-40 bg-slate-950 text-slate-200 border-e border-slate-800/80 flex flex-col transition-all duration-200 lg:static ${
                    collapsed ? 'lg:w-20 w-72' : 'w-72'
                } ${sidebarOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Brand Header + Collapse Button */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
                    <Link href="/admin" className="min-w-0">
                        <BrandLogo variant="dark" showText={!collapsed} customName={settings.site_name || 'Sannafly'} />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setCollapsed((v) => !v)}
                        className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? (
                            <ChevronRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        ) : (
                            <ChevronLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick Search Filter inside Sidebar */}
                {!collapsed && (
                    <div className="px-3.5 pt-3.5 pb-1">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={navQuery}
                                onChange={(e) => setNavQuery(e.target.value)}
                                placeholder={locale === 'ar' ? 'بحث سريع في القائمة...' : 'Quick jump...'}
                                className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
                    {navGroups.map((group) => {
                        const isGroupCollapsed = Boolean(collapsedGroups[group.key]) && !navQuery.trim();
                        return (
                            <div key={group.key}>
                                {!collapsed && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.key)}
                                        className="w-full px-3 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <span>{group.title}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                                    </button>
                                )}

                                {!isGroupCollapsed && (
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const active =
                                                item.href === '/admin'
                                                    ? currentPath === '/admin'
                                                    : currentPath.startsWith(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    title={collapsed ? item.label : undefined}
                                                    className={`group relative flex items-center ${
                                                        collapsed ? 'justify-center px-2' : 'justify-between px-3'
                                                    } py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                        active
                                                            ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border border-teal-500/30 shadow-xs'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                                    }`}
                                                >
                                                    {active && (
                                                        <span className="absolute start-0 top-2 bottom-2 w-1 rounded-full bg-teal-400" />
                                                    )}
                                                    <span className="flex items-center gap-3 min-w-0">
                                                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-500 group-hover:text-teal-400'}`} />
                                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Storefront + User Card */}
                <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/50">
                    <Link
                        href="/"
                        title={collapsed ? t('storefront') : undefined}
                        className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold text-teal-300 bg-teal-950/50 border border-teal-900/60 hover:bg-teal-900/50 transition-colors`}
                    >
                        <span className="flex items-center gap-2.5">
                            <Store className="w-4 h-4 shrink-0" />
                            {!collapsed && <span>{t('storefront')}</span>}
                        </span>
                        {!collapsed && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
                    </Link>

                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl bg-slate-900 border border-slate-800/80`}>
                        <Link href="/admin/profile" className="flex items-center gap-2.5 min-w-0 hover:opacity-90">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            {!collapsed && (
                                <div className="min-w-0 leading-tight">
                                    <div className="text-xs font-semibold text-white truncate">{auth.user?.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate capitalize">{auth.user?.roles?.[0]?.replace('-', ' ')}</div>
                                </div>
                            )}
                        </Link>
                        {!collapsed && (
                            <button
                                onClick={() => router.post('/admin/logout')}
                                title={t('logout')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="no-print sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{title || t('dashboard')}</h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {adminAlerts && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setAlertsOpen((v) => !v)}
                                    aria-label="Notifications"
                                    className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors"
                                >
                                    <Bell className="w-4 h-4 text-slate-600" />
                                    {adminAlerts.total > 0 && (
                                        <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                                            {adminAlerts.total > 99 ? '99+' : adminAlerts.total}
                                        </span>
                                    )}
                                </button>
                                {alertsOpen && (
                                    <div className="absolute end-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 shadow-lg p-3 space-y-2 z-50 text-xs">
                                        <div className="font-bold text-slate-800 dark:text-slate-100 px-1">
                                            {locale === 'ar' ? 'التنبيهات' : 'Alerts'}
                                        </div>
                                        <Link href="/admin/orders?status=pending" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                                            <span>{locale === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Orders'}</span>
                                            <span className="font-bold text-amber-700">{adminAlerts.pending_orders}</span>
                                        </Link>
                                        <Link href="/admin/orders" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                                            <span>{locale === 'ar' ? 'طلبات تحتاج مراجعة الدفع' : 'Payment Review Needed'}</span>
                                            <span className="font-bold text-rose-700">{adminAlerts.review_orders}</span>
                                        </Link>
                                        <Link href="/admin/inventory" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                                            <span>{locale === 'ar' ? 'منتجات مخزونها منخفض' : 'Low Stock Products'}</span>
                                            <span className="font-bold text-orange-700">{adminAlerts.low_stock}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                        {can('products.create') && (
                            <Link
                                href="/admin/products/create"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'منتج جديد' : 'New Product'}</span>
                            </Link>
                        )}
                        <a
                            href={`/locale/${locale === 'ar' ? 'en' : 'ar'}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
                        </a>
                        <ThemeToggle mode={mode} isDark={isDark} onChange={setMode} locale={locale} />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                    {flash?.success && (
                        <div className="no-print mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm font-medium shadow-xs">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="no-print mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-sm font-medium shadow-xs">
                            {flash.error}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
