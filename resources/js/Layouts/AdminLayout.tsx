import React, { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Bell,
    BookOpen,
    Boxes,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Database,
    ExternalLink,
    FileCode2,
    FileSpreadsheet,
    FileText,
    FolderTree,
    Globe,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
    Package,
    Paintbrush,
    Palette,
    Percent,
    Plus,
    Printer,
    Rocket,
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
import { useRealtimeFeed, type RealtimeNotificationItem } from '@/lib/useRealtime';
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
    const pageProps = usePage<PageProps>().props as any;
    const initialAlerts = pageProps.adminAlerts as
        | { total: number; pending_orders: number; review_orders: number; low_stock: number }
        | null
        | undefined;
    const [liveAlerts, setLiveAlerts] = useState(initialAlerts);
    const [unreadNotifs, setUnreadNotifs] = useState<number>(Number(pageProps.adminUnreadNotifications ?? 0));
    const [liveNotifs, setLiveNotifs] = useState<RealtimeNotificationItem[]>([]);
    const [liveToast, setLiveToast] = useState<RealtimeNotificationItem | null>(null);
    const seenNotifIds = useRef<Set<string>>(new Set());
    const initializedFeed = useRef(false);
    const lastOrderStamp = useRef<string | null>(null);

    const adminAlerts = liveAlerts ?? initialAlerts;

    useRealtimeFeed<{
        unread_count: number;
        notifications: RealtimeNotificationItem[];
        admin_alerts: { total: number; pending_orders: number; review_orders: number; low_stock: number };
        dashboard_pulse?: { latest_order_updated_at?: string | null };
    }>('/admin/realtime/feed', Boolean(auth.user), (data) => {
        setLiveAlerts(data.admin_alerts);
        setUnreadNotifs(data.unread_count);
        setLiveNotifs(data.notifications || []);

        const ids = (data.notifications || []).map((n) => n.id);
        if (!initializedFeed.current) {
            ids.forEach((id) => seenNotifIds.current.add(id));
            initializedFeed.current = true;
            lastOrderStamp.current = data.dashboard_pulse?.latest_order_updated_at ?? null;
            return;
        }

        const fresh = (data.notifications || []).find((n) => !n.read_at && !seenNotifIds.current.has(n.id));
        ids.forEach((id) => seenNotifIds.current.add(id));
        if (fresh) {
            setLiveToast(fresh);
            setTimeout(() => setLiveToast((cur) => (cur?.id === fresh.id ? null : cur)), 6000);
        }

        const nextStamp = data.dashboard_pulse?.latest_order_updated_at ?? null;
        if (nextStamp && nextStamp !== lastOrderStamp.current) {
            lastOrderStamp.current = nextStamp;
            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            if (path === '/admin' || path.startsWith('/admin/orders') || path === '/admin/notifications') {
                router.reload({ preserveState: true, preserveScroll: true } as any);
            }
        }
    });
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('cf_sidebar_collapsed') === '1';
    });
    const [navQuery, setNavQuery] = useState('');
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

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const isItemActive = (href: string) =>
        href === '/admin' ? currentPath === '/admin' : currentPath === href || currentPath.startsWith(`${href}/`);

    const rawNavGroups = [
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
            key: 'appearance',
            title: locale === 'ar' ? 'المظهر والإعدادات' : 'Design & Settings',
            items: [
                { label: t('customizer'), href: '/admin/customizer', icon: Paintbrush, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'قوالب الثيم' : 'Theme Presets', href: '/admin/customizer/themes', icon: Palette, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'السياسات والصفحات' : 'Policies & Pages', href: '/admin/policies', icon: ShieldCheck, perm: 'settings.manage' },
                { label: t('settings'), href: '/admin/settings', icon: Settings, perm: 'settings.view' },
            ],
        },
        {
            key: 'system',
            title: locale === 'ar' ? 'النظام والأمان' : 'System & Security',
            items: [
                { label: t('users'), href: '/admin/users', icon: Users, perm: 'users.view' },
                { label: t('roles'), href: '/admin/roles', icon: Shield, perm: 'users.manage_roles' },
                { label: locale === 'ar' ? 'الإشعارات' : 'Notifications', href: '/admin/notifications', icon: Bell, perm: 'dashboard.access' },
                { label: t('audit_logs'), href: '/admin/system/audit-logs', icon: Activity, perm: 'audit_logs.view' },
                { label: locale === 'ar' ? 'سجلات النظام' : 'System Logs', href: '/admin/system-logs', icon: FileText, perm: 'audit_logs.view' },
                { label: locale === 'ar' ? 'صحة النظام' : 'System Health', href: '/admin/system/health', icon: Activity, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'النسخ الاحتياطي' : 'Backups & Restore', href: '/admin/system/backups', icon: Database, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'التحديثات' : 'System Updates', href: '/admin/system/updates', icon: Rocket, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'تقرير الدعم' : 'Support Export', href: '/admin/system/support', icon: FileCode2, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'أدوات الصيانة' : 'System Tools', href: '/admin/system-tools', icon: Wrench, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'الترخيص' : 'License', href: '/admin/system/license', icon: KeyRound, perm: 'settings.manage' },
                { label: locale === 'ar' ? 'مركز التعلم والمساعدة' : 'Learning Center', href: '/admin/help', icon: BookOpen, perm: 'dashboard.access' },
            ],
        },
    ];

    const navGroups = rawNavGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    can(item.perm) &&
                    (!navQuery.trim() || item.label.toLowerCase().includes(navQuery.trim().toLowerCase()))
            ),
        }))
        .filter((group) => group.items.length > 0);

    const activeGroupKey =
        navGroups.find((g) => g.items.some((item) => isItemActive(item.href)))?.key || 'catalog';

    const [openGroup, setOpenGroup] = useState<string>(() => {
        if (typeof window === 'undefined') return activeGroupKey;
        const saved = localStorage.getItem('cf_sidebar_open_group');
        return saved || activeGroupKey;
    });

    useEffect(() => {
        setOpenGroup(activeGroupKey);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cf_sidebar_open_group', activeGroupKey);
        }
    }, [activeGroupKey]);

    const toggleGroup = (key: string) => {
        setOpenGroup((prev) => {
            const next = prev === key ? '' : key;
            if (typeof window !== 'undefined') {
                localStorage.setItem('cf_sidebar_open_group', next);
            }
            return next;
        });
    };

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
                        <BrandLogo
                            variant="dark"
                            showText={!collapsed}
                            customName={settings.site_name || 'MyStore'}
                            logoUrl={settings.brand_logo_dark || settings.brand_logo || null}
                        />
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

                {/* Navigation Groups (Smart Accordion) */}
                <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
                    {navGroups.map((group) => {
                        const isSearching = Boolean(navQuery.trim());
                        const isOpen = collapsed || isSearching || openGroup === group.key;
                        const hasActiveItem = group.items.some((item) => isItemActive(item.href));
                        return (
                            <div
                                key={group.key}
                                className={!collapsed ? 'rounded-xl bg-slate-900/40 border border-slate-800/60 overflow-hidden' : ''}
                            >
                                {!collapsed && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.key)}
                                        className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                            isOpen || hasActiveItem
                                                ? 'text-teal-300 bg-slate-900/80'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span className="truncate">{group.title}</span>
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                                {group.items.length}
                                            </span>
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90 rtl:rotate-90'}`} />
                                    </button>
                                )}

                                {isOpen && (
                                    <div className={collapsed ? 'space-y-1' : 'p-1.5 space-y-0.5'}>
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isItemActive(item.href);
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    title={collapsed ? item.label : undefined}
                                                    className={`group relative flex items-center ${
                                                        collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                                                    } rounded-lg text-[13px] font-medium transition-all ${
                                                        active
                                                            ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border border-teal-500/30 shadow-xs'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    {active && (
                                                        <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-full bg-teal-400" />
                                                    )}
                                                    <span className="flex items-center gap-2.5 min-w-0">
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
                                    <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    {(unreadNotifs > 0 || adminAlerts.total > 0) && (
                                        <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                                            {(unreadNotifs || adminAlerts.total) > 99 ? '99+' : unreadNotifs || adminAlerts.total}
                                        </span>
                                    )}
                                </button>
                                {alertsOpen && (
                                    <div className="absolute end-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-2 z-50 text-xs">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                                {locale === 'ar' ? 'التنبيهات والإشعارات' : 'Alerts & Notifications'}
                                            </span>
                                            <Link href="/admin/notifications" onClick={() => setAlertsOpen(false)} className="text-teal-700 dark:text-teal-400 font-semibold hover:underline">
                                                {locale === 'ar' ? 'عرض الكل' : 'View All'}
                                            </Link>
                                        </div>
                                        <Link href="/admin/orders?status=pending" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <span>{locale === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Orders'}</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">{adminAlerts.pending_orders}</span>
                                        </Link>
                                        <Link href="/admin/orders" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <span>{locale === 'ar' ? 'طلبات تحتاج مراجعة الدفع' : 'Payment Review Needed'}</span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400">{adminAlerts.review_orders}</span>
                                        </Link>
                                        <Link href="/admin/inventory" onClick={() => setAlertsOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <span>{locale === 'ar' ? 'منتجات مخزونها منخفض' : 'Low Stock Products'}</span>
                                            <span className="font-bold text-orange-600 dark:text-orange-400">{adminAlerts.low_stock}</span>
                                        </Link>
                                        {liveNotifs.length > 0 && (
                                            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1 max-h-56 overflow-y-auto">
                                                {liveNotifs.slice(0, 4).map((n) => (
                                                    <Link
                                                        key={n.id}
                                                        href={n.data.url || '/admin/notifications'}
                                                        onClick={() => setAlertsOpen(false)}
                                                        className={`block p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 ${!n.read_at ? 'bg-teal-50/50 dark:bg-teal-950/30' : ''}`}
                                                    >
                                                        <div className="font-semibold truncate">
                                                            {locale === 'ar' ? n.data.title_ar || n.data.title_en : n.data.title_en}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5">{n.human_time}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
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
                    {pageProps.demoMode && (
                        <div className="no-print mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
                            <span>
                                {locale === 'ar'
                                    ? 'وضع العرض التجريبي (Demo Mode) مفعّل — العمليات الحساسة محمية ومقيدة.'
                                    : 'Demo Mode Active — Destructive and system-critical operations are restricted.'}
                            </span>
                            <button
                                type="button"
                                onClick={() => router.post('/admin/system/demo/reset')}
                                className="px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {locale === 'ar' ? 'إعادة ضبط البيانات التجريبية' : 'Reset Demo Data'}
                            </button>
                        </div>
                    )}
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

            {liveToast && (
                <div className="no-print fixed bottom-5 end-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-fade-up">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0">
                        <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link href={liveToast.data.url || '/admin/notifications'} onClick={() => setLiveToast(null)} className="text-xs font-bold block hover:underline">
                            {locale === 'ar' ? liveToast.data.title_ar || liveToast.data.title_en : liveToast.data.title_en}
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {locale === 'ar' ? liveToast.data.body_ar || liveToast.data.body_en : liveToast.data.body_en}
                        </p>
                    </div>
                    <button type="button" onClick={() => setLiveToast(null)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
