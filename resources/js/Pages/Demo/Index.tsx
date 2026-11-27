import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Compass,
    CreditCard,
    Globe,
    Lock,
    Package,
    Palette,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Store,
    UserCheck,
} from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { useColorMode } from '@/lib/colorMode';
import { useTranslation } from '@/lib/i18n';

interface Props {
    demoEnabled: boolean;
}

export default function DemoHub({ demoEnabled }: Props) {
    const { locale, dir, settings, localized } = useTranslation();
    const { mode, isDark, setMode, cycleMode } = useColorMode();
    const isAr = locale === 'ar';
    const siteName = localized(settings?.site_name || 'Sannafly', settings?.site_name_ar);

    const verifiedFeatures = [
        {
            icon: Store,
            en: 'Bilingual Storefront (AR/EN, RTL/LTR) + Dark/Light Mode',
            ar: 'متجر ثنائي اللغة (عربي/إنجليزي، RTL/LTR) مع الوضع الداكن والفاتح',
        },
        {
            icon: Package,
            en: '5-Step Product Wizard, Variations & Multi-Tier Pricing',
            ar: 'معالج منتج من 5 خطوات، المتغيرات، والتسعير متعدد المستويات',
        },
        {
            icon: ShoppingBag,
            en: 'Order State Machine, Invoices & Shipping Labels',
            ar: 'دورة حياة الطلبات، الفواتير، وملصقات الشحن القابلة للطباعة',
        },
        {
            icon: Palette,
            en: 'White-Label Customizer & JSON Theme Presets',
            ar: 'مخصّص الهوية البيضاء وقوالب الثيم القابلة للتصدير',
        },
        {
            icon: BarChart3,
            en: 'Sales Analytics, CSV Export & Inventory Stock Ledger',
            ar: 'تحليلات المبيعات، تصدير CSV، وسجل حركات المخزون',
        },
        {
            icon: ShieldCheck,
            en: 'Granular RBAC, Audit Logs, Backups, Health & Licensing',
            ar: 'صلاحيات RBAC دقيقة، سجل التدقيق، النسخ الاحتياطي، والتراخيص',
        },
    ];

    return (
        <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Head title={isAr ? 'النسخة التجريبية الحية (Live Demo)' : 'Live Interactive Demo'} />

            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <Link href="/product">
                        <BrandLogo variant={isDark ? 'dark' : 'light'} customName={siteName} />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/product"
                            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {isAr ? 'عن المنتج' : 'Product Overview'}
                        </Link>
                        <a
                            href={`/locale/${isAr ? 'en' : 'ar'}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                            <Globe className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'English' : 'العربية'}</span>
                        </a>
                        <ThemeToggle mode={mode} isDark={isDark} onChange={setMode} onCycle={cycleMode} locale={locale} />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-10 sm:py-12 space-y-10">
                {/* Intro */}
                <div className="text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isAr ? 'بوابة العرض التجريبي التفاعلية' : 'Interactive Product Demonstration Portal'}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {isAr ? 'جرّب المتجر ولوحة التحكم مباشرة' : 'Explore Storefront & Admin Dashboard Live'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {isAr
                            ? 'هذه نسخة عرض تفاعلية مصممة لاختبار تجربة التسوق، الدفع المحاكى، ولوحة الإدارة بحساب مراجعة مقيّد يحمي النظام والبيانات.'
                            : 'This interactive demo lets you test the customer shopping flow, simulated checkout, and Admin Dashboard via a restricted Demo Reviewer session.'}
                    </p>
                </div>

                {!demoEnabled && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm text-center">
                        {isAr
                            ? 'ملاحظة: وضع العرض التجريبي (Demo Mode) غير مفعّل حاليًا على هذا التثبيت. يمكن للمالك تفعيله من /admin/system-tools أو APP_DEMO_MODE=true.'
                            : 'Note: Demo Mode is currently disabled on this installation. Owners can enable it from /admin/system-tools or APP_DEMO_MODE=true.'}
                    </div>
                )}

                {/* Two Entry Portals */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Storefront Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between gap-6 shadow-sm">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                                <Store className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">{isAr ? 'واجهة المتجر (Storefront)' : 'Demo Storefront'}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {isAr
                                    ? 'تصفح المنتجات، المتغيرات، السلة، الكوبونات، مناطق الشحن، وتتبع الطلبات مع محاكاة كاملة للدفع.'
                                    : 'Browse products, variations, cart, coupons, shipping zones, and order tracking with simulated checkout.'}
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    {isAr ? 'دعم كامل للعربية (RTL) والإنجليزية (LTR)' : 'Full Arabic (RTL) & English (LTR) switching'}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    {isAr ? 'محاكاة الدفع: لا يتم خصم أي أموال حقيقية' : 'Simulated payments: zero real charges'}
                                </li>
                            </ul>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{isAr ? 'دخول المتجر التجريبي' : 'Explore Demo Storefront'}</span>
                            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        </Link>
                    </div>

                    {/* Demo Admin Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between gap-6 shadow-sm">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">{isAr ? 'لوحة تحكم الإدارة (Demo Admin)' : 'Demo Admin Dashboard'}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {isAr
                                    ? 'ادخل بضغطة واحدة بحساب Demo Reviewer المقيّد لاستعراض المنتجات، المخزون، الطلبات، التحليلات، وسجلات التدقيق مع جولة إرشادية.'
                                    : 'Enter with one click via a restricted Demo Reviewer session to inspect Products, Inventory, Orders, Analytics, and Audit Logs with a guided tour.'}
                            </p>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                                <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                                    <span>{isAr ? 'يتضمن جولة إرشادية تفاعلية من 8 خطوات' : 'Includes an 8-step interactive Guided Tour'}</span>
                                </div>
                                <div className="text-slate-500 flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>
                                        {isAr
                                            ? 'محمي بـ RBAC وDemoModeGuard: التعديلات الحساسة والأسرار مغلقة.'
                                            : 'Enforced by RBAC & DemoModeGuard: settings, secrets, and deletions locked.'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {demoEnabled ? (
                            <button
                                type="button"
                                onClick={() => router.post('/demo/login-admin')}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:opacity-95 text-white text-sm font-bold"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{isAr ? 'دخول لوحة التحكم + بدء الجولة' : 'Enter Demo Dashboard + Guided Tour'}</span>
                            </button>
                        ) : (
                            <Link
                                href="/admin/login"
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span>{isAr ? 'صفحة دخول الإدارة' : 'Go to Admin Login'}</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Feature Overview */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
                    <div>
                        <h2 className="text-lg font-bold">{isAr ? 'ما الذي يمكنك استكشافه في النسخة التجريبية؟' : 'What You Can Explore'}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {isAr ? 'جميع الميزات التالية منفذة وتعمل فعليًا داخل المنصة.' : 'All capabilities listed below are implemented and active in the platform.'}
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {verifiedFeatures.map((f, idx) => {
                            const Icon = f.icon;
                            return (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                                    <Icon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                                    <span className="text-xs sm:text-sm font-medium leading-snug">{isAr ? f.ar : f.en}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Limitations & Simulation Transparency */}
                <section className="rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{isAr ? 'حدود النسخة التجريبية والعمليات المحاكاة' : 'Demo Limitations & Simulated Operations'}</span>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-2 text-xs text-amber-900/90 dark:text-amber-200/90 list-disc ps-5">
                        <li>
                            {isAr
                                ? 'الدفع الإلكتروني محاكى بالكامل ولا يتصل بأي بوابة دفع حقيقية.'
                                : 'Online payment gateways are simulated; no real charges or external gateway calls occur.'}
                        </li>
                        <li>
                            {isAr
                                ? 'حساب Demo Reviewer يملك صلاحيات عرض ومعاينة فقط (قراءة بدون تخريب).'
                                : 'Demo Reviewer session uses least-privilege read/preview permissions enforced server-side.'}
                        </li>
                        <li>
                            {isAr
                                ? 'حفظ الإعدادات، الحذف، النسخ الاحتياطي، التحديثات، ومفاتيح الدفع محظورة عبر DemoModeGuard.'
                                : 'Settings edits, deletions, backups, updates, and payment secrets are blocked by DemoModeGuard.'}
                        </li>
                        <li>
                            {isAr
                                ? 'للمشترين: يُنصح دائمًا بتشغيل الديمو على قاعدة بيانات منفصلة عن متجر الإنتاج.'
                                : 'Deployment note: Always host public demos on an isolated demo database separate from production.'}
                        </li>
                    </ul>
                </section>
            </main>
        </div>
    );
}
