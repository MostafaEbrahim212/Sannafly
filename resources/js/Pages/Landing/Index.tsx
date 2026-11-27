import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    Database,
    FileSpreadsheet,
    Globe,
    Layers,
    Lock,
    Menu,
    Package,
    Paintbrush,
    Printer,
    Rocket,
    Server,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Truck,
    X,
} from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import SeoHead from '@/Components/SeoHead';
import ThemeToggle from '@/Components/ThemeToggle';
import { useColorMode } from '@/lib/colorMode';
import { useTranslation } from '@/lib/i18n';

interface Props {
    product: { name: string; version: string };
}

export default function ProductLandingPage({ product }: Props) {
    const { locale, dir, settings, localized } = useTranslation();
    const { mode, isDark, setMode, cycleMode } = useColorMode();
    const isAr = locale === 'ar';

    const [mobileMenu, setMobileMenu] = useState(false);
    const [activeShowcase, setActiveShowcase] = useState<'dashboard' | 'catalog' | 'customizer' | 'operations'>('dashboard');
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const productName = localized(settings?.site_name || product.name, settings?.site_name_ar) || product.name;

    const featureCategories = [
        {
            icon: Package,
            titleEn: 'Product & Catalog Management',
            titleAr: 'إدارة المنتجات والكتالوج',
            descEn: 'Simple & variable products, color/select attributes, multi-tier pricing (Regular, Sale, Wholesale), and WebP image optimization.',
            descAr: 'منتجات بسيطة ومتعددة الخيارات، خصائص الألوان والمقاسات، تسعير متعدد المستويات، ومعالجة صور WebP.',
        },
        {
            icon: ShoppingBag,
            titleEn: 'Storefront, Cart & Checkout',
            titleAr: 'واجهة المتجر والسلة والدفع',
            descEn: 'Guest & registered checkout, advanced coupons (percent, fixed, free shipping, first order), 27 Egyptian governorates, and weight-based shipping.',
            descAr: 'إتمام طلب للزوار والمسجلين، كوبونات متقدمة، تغطية الـ 27 محافظة، وحساب الشحن بالوزن.',
        },
        {
            icon: CreditCard,
            titleEn: 'Modular Payment Gateways',
            titleAr: 'بوابات دفع متعددة وقابلة للتخصيص',
            descEn: 'Configurable MyFatoorah, Fawry, Paymob, Kashier with HMAC/API verification, plus InstaPay/Wallet receipt upload, Bank Transfer, and COD.',
            descAr: 'دعم قابل للتفعيل لـ MyFatoorah وFawry وPaymob وKashier مع تحقق التوقيع، إضافةً لرفع إيصال إنستاباي والتحويل البنكي والدفع عند الاستلام.',
        },
        {
            icon: Paintbrush,
            titleEn: 'White-Label & Theme Presets',
            titleAr: 'هوية بيضاء وقوالب تصميم جاهزة',
            descEn: 'Neutral defaults, 6 niche presets, live desktop/mobile/dark/light preview, reorderable homepage sections, promo bar, and popup.',
            descAr: 'هوية قابلة للتخصيص بالكامل، 6 قوالب جاهزة، معاينة فورية، وإعادة ترتيب أقسام الصفحة الرئيسية.',
        },
        {
            icon: ShieldCheck,
            titleEn: 'RBAC & Security Hardening',
            titleAr: 'الصلاحيات والأمان الهندسي',
            descEn: 'Dual-guard auth (Admin & Customer), granular permissions, BCMath decimal money arithmetic, immutable audit logs, and CSRF/XSS protection.',
            descAr: 'فصل كامل بين جلسات الإدارة والعملاء، صلاحيات دقيقة، حسابات مالية بـ BCMath، وسجل تدقيق غير قابل للتعديل.',
        },
        {
            icon: Server,
            titleEn: 'Operations, Installer & Backups',
            titleAr: 'التثبيت التلقائي والنسخ الاحتياطي',
            descEn: '7-step Web Installer (/install), System Health checks, SHA-256 SQL/ZIP backups & restore, sanitized support export, and Demo Mode sandbox.',
            descAr: 'معالج تثبيت من 7 خطوات، فحص صحة النظام، نسخ احتياطي واستعادة بـ SHA-256، تصدير دعم فني معقم، ووضع Demo محمي.',
        },
        {
            icon: FileSpreadsheet,
            titleEn: 'Import, Export & A4 Printing',
            titleAr: 'الاستيراد والتصدير والطباعة',
            descEn: 'Excel/CSV product import & export with validation, printable A4 invoices, AWB shipping labels, and catalog print views.',
            descAr: 'استيراد وتصدير Excel/CSV، طباعة فواتير A4، بوالص شحن AWB، وطباعة كتالوج المنتجات.',
        },
        {
            icon: BarChart3,
            titleEn: 'Analytics & Live Notifications',
            titleAr: 'التحليلات والإشعارات الفورية',
            descEn: 'Sales analytics with CSV export, admin & customer database notifications, and live feed polling for order/payment updates.',
            descAr: 'تحليلات مبيعات مع تصدير CSV، إشعارات الإدارة والعملاء، وتحديث مباشر لحالات الطلبات والدفع.',
        },
    ];

    const showcaseTabs = {
        dashboard: {
            labelEn: 'Admin Dashboard & Analytics',
            labelAr: 'لوحة التحكم والتحليلات',
            titleEn: 'Unified Operations & Sales Visibility',
            titleAr: 'رؤية شاملة للمبيعات والعمليات',
            pointsEn: [
                'Live KPIs for revenue, pending orders, payment reviews, and low-stock alerts',
                'Sales Analytics page with date filtering and formula-safe CSV export',
                'Order state machine with tracking numbers and AWB shipping labels',
            ],
            pointsAr: [
                'مؤشرات أداء مباشرة للإيرادات والطلبات المعلقة وتنبيهات المخزون',
                'صفحة تحليلات مبيعات مع فلترة التاريخ وتصدير CSV آمن',
                'إدارة مراحل الطلب مع أرقام التتبع وبوليصة الشحن AWB',
            ],
        },
        catalog: {
            labelEn: 'Catalog & Inventory',
            labelAr: 'الكتالوج والمخزون',
            titleEn: 'Flexible Pricing & Atomic Stock Control',
            titleAr: 'تسعير مرن وإدارة مخزون دقيقة',
            pointsEn: [
                'Multi-tier pricing (Regular, Sale, Wholesale) with BCMath decimal precision',
                'Product variations with color swatches and variation-specific images',
                'Transactional stock reservations & full movement audit trail',
            ],
            pointsAr: [
                'تسعير متعدد المستويات (عادي، تخفيض، جملة) بدقة BCMath',
                'خيارات منتجات بالألوان والصور الخاصة بكل خيار',
                'حجز مخزون آمن بالمعاملات مع سجل حركات كامل',
            ],
        },
        customizer: {
            labelEn: 'Customizer & Presets',
            labelAr: 'المخصص وقوالب الثيم',
            titleEn: 'White-Label Brand & Layout Control',
            titleAr: 'تحكم كامل في الهوية والتصميم',
            pointsEn: [
                '6 industry presets (Electronics, Fashion, Cosmetics, General, Minimal, Luxury)',
                'Drag-free Up/Down homepage section ordering & promotional banner controls',
                'Full Arabic/English (RTL/LTR) and Light/Dark/System theme modes',
            ],
            pointsAr: [
                '6 قوالب جاهزة لمختلف المجالات مع استيراد وتصدير JSON آمن',
                'ترتيب أقسام الصفحة الرئيسية وتخصيص شريط الإعلانات والنوافذ المنبثقة',
                'دعم كامل للعربية والإنجليزية (RTL/LTR) والوضع الداكن والفاتح',
            ],
        },
        operations: {
            labelEn: 'Health, Backups & Licensing',
            labelAr: 'الصحة والباك اب والترخيص',
            titleEn: 'Built-In Commercial Operations Suite',
            titleAr: 'أدوات تشغيل وصيانة متكاملة للمنتج التجاري',
            pointsEn: [
                'System Health diagnostics covering DB, Storage, PHP, Mail, Queue, and Security',
                'SHA-256 verified SQL/ZIP backups, retention cleanup, and locked SQL restore',
                'Sanitized Support Diagnostic Export, Update architecture, and License management',
            ],
            pointsAr: [
                'فحص صحة قاعدة البيانات والتخزين وPHP والبريد والأمان',
                'نسخ احتياطي واستعادة محمية ببصمة SHA-256 وسياسة احتفاظ',
                'تصدير تقارير دعم معقمة ونظام تراخيص مع فترة سماح 14 يومًا',
            ],
        },
    };

    const faqs = [
        {
            qEn: 'What is this product and who is it for?',
            qAr: 'ما هو هذا المنتج ولمن هو موجه؟',
            aEn: 'It is a complete Laravel 13 + React 19 e-commerce and catalog platform designed for merchants launching bilingual stores and agencies delivering white-label client projects.',
            aAr: 'منصة تجارة إلكترونية وكتالوج منتجات متكاملة مبنية بـ Laravel 13 وReact 19، موجهة للتجار لإطلاق متاجر ثنائية اللغة وللشركات والمطورين لتسليم مشاريع White-Label للعملاء.',
        },
        {
            qEn: 'Can I install it on cPanel shared hosting without SSH?',
            qAr: 'هل يمكن تركيبه على استضافة cPanel مشتركة بدون SSH؟',
            aEn: 'Yes. The built-in 7-step Web Installer (/install) checks PHP requirements, tests MySQL connectivity, generates .env safely, runs migrations/seeders, and creates your Owner account from the browser.',
            aAr: 'نعم، يحتوي السكربت على معالج تثبيت من 7 خطوات (/install) يفحص المتطلبات ويختبر قاعدة البيانات وينشئ ملف .env ويشغل الجداول وحساب المالك من المتصفح مباشرة.',
        },
        {
            qEn: 'Does it support Arabic and RTL?',
            qAr: 'هل يدعم اللغة العربية واتجاه RTL بالكامل؟',
            aEn: 'Yes. Both the Storefront and Admin Dashboard support English (LTR) and Arabic (RTL) with bilingual product, category, policy, and notification content.',
            aAr: 'نعم، الواجهة ولوحة التحكم تدعمان العربية (RTL) والإنجليزية (LTR) بالكامل مع محتوى ثنائي اللغة للمنتجات والأقسام والسياسات والإشعارات.',
        },
        {
            qEn: 'Are payment gateways ready out of the box?',
            qAr: 'هل بوابات الدفع جاهزة للتشغيل؟',
            aEn: 'MyFatoorah, Fawry, Paymob, and Kashier integrations are built-in and configurable from Admin → Payment Methods once you add your merchant credentials and HTTPS domain. InstaPay/Vodafone Cash receipt upload and COD work immediately.',
            aAr: 'بوابات MyFatoorah وFawry وPaymob وKashier مدمجة وقابلة للتفعيل من لوحة الإدارة بمجرد إدخال مفاتيح التاجر على دومين HTTPS، كما يعمل التحويل بالمحافظ/إنستاباي والدفع عند الاستلام مباشرة.',
        },
        {
            qEn: 'Is there a live demo I can explore before deploying?',
            qAr: 'هل تتوفر نسخة تجريبية لاستكشاف النظام؟',
            aEn: 'Yes. Visit /demo to browse the storefront or sign into the Admin Dashboard using the sandboxed Demo Reviewer account protected by DemoModeGuard.',
            aAr: 'نعم، يمكنك زيارة صفحة /demo لتجربة المتجر أو الدخول للوحة الإدارة بحساب معاينة مقيد ومحمي بـ DemoModeGuard.',
        },
    ];

    const currentTab = showcaseTabs[activeShowcase];

    return (
        <div dir={dir} className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 scroll-smooth">
            <SeoHead
                title={`${productName} — Bilingual E-Commerce & Catalog Platform`}
                description="Laravel 13 + React 19 white-label e-commerce platform with Arabic/English RTL/LTR, guided web installer, payment gateways, and commercial operations tools."
            />
            <Head title={`${productName} v${product.version}`} />

            {/* Sticky Navigation */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <Link href="/product" className="shrink-0">
                        <BrandLogo variant={isDark ? 'dark' : 'light'} customName={productName} />
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <a href="#features" className="hover:text-teal-700 dark:hover:text-teal-400">{isAr ? 'المميزات' : 'Features'}</a>
                        <a href="#showcase" className="hover:text-teal-700 dark:hover:text-teal-400">{isAr ? 'استعراض النظام' : 'Showcase'}</a>
                        <a href="#integrations" className="hover:text-teal-700 dark:hover:text-teal-400">{isAr ? 'الدفع والتكامل' : 'Integrations'}</a>
                        <a href="#requirements" className="hover:text-teal-700 dark:hover:text-teal-400">{isAr ? 'المتطلبات' : 'Requirements'}</a>
                        <a href="#faq" className="hover:text-teal-700 dark:hover:text-teal-400">{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <a
                            href={`/locale/${isAr ? 'en' : 'ar'}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                            <Globe className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'EN' : 'عربي'}</span>
                        </a>
                        <ThemeToggle mode={mode} isDark={isDark} onChange={setMode} onCycle={cycleMode} locale={locale} variant="compact" />
                        <Link
                            href="/demo"
                            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                        >
                            <span>{isAr ? 'جرب الديمو' : 'Try Demo'}</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenu((v) => !v)}
                            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {mobileMenu && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-2 text-sm font-semibold bg-white dark:bg-slate-950">
                        <a href="#features" onClick={() => setMobileMenu(false)} className="block py-1.5">{isAr ? 'المميزات' : 'Features'}</a>
                        <a href="#showcase" onClick={() => setMobileMenu(false)} className="block py-1.5">{isAr ? 'استعراض النظام' : 'Showcase'}</a>
                        <a href="#integrations" onClick={() => setMobileMenu(false)} className="block py-1.5">{isAr ? 'الدفع والتكامل' : 'Integrations'}</a>
                        <a href="#faq" onClick={() => setMobileMenu(false)} className="block py-1.5">{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</a>
                        <Link href="/demo" className="block text-center py-2.5 rounded-xl bg-teal-700 text-white font-bold">
                            {isAr ? 'جرب الديمو الحي' : 'Try Live Demo'}
                        </Link>
                    </div>
                )}
            </header>

            {/* 1. Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>v{product.version} • Laravel 13 + React 19 + TypeScript</span>
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                            {isAr
                                ? 'منصة متاجر إلكترونية ثنائية اللغة جاهزة للإطلاق والبيع'
                                : 'White-Label Bilingual E-Commerce & Catalog Platform'}
                        </h1>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                            {isAr
                                ? 'نظام متكامل باللغتين العربية والإنجليزية (RTL/LTR) مع معالج تثبيت تلقائي، بوابات دفع مصرية وعربية، صلاحيات RBAC، وإدارة كاملة للعمليات والنسخ الاحتياطي.'
                                : 'Built for merchants and agencies: full Arabic/English (RTL/LTR), guided 7-step web installer, configurable regional payment gateways, granular RBAC, and built-in backup & health tools.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Link
                                href="/demo"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-md"
                            >
                                <span>{isAr ? 'استكشف الديمو الحي' : 'Explore Live Demo'}</span>
                                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span>{isAr ? 'معاينة المتجر' : 'View Storefront'}</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> {isAr ? 'معالج تثبيت /install' : 'Guided /install Wizard'}</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> {isAr ? 'عربي/إنجليزي RTL/LTR' : 'Arabic & English RTL/LTR'}</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> {isAr ? 'حسابات مالية BCMath' : 'BCMath Decimal Precision'}</div>
                        </div>
                    </div>

                    {/* Hero Visual Preview Card */}
                    <div className="lg:col-span-5">
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                                    {isAr ? 'نظرة سريعة على البنية' : 'Platform Architecture'}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">v{product.version}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1">
                                    <Database className="w-4 h-4 text-teal-600" />
                                    <div className="font-bold">{isAr ? 'نسخ احتياطي SHA-256' : 'SHA-256 Backups'}</div>
                                    <div className="text-slate-500">{isAr ? 'حفظ واستعادة آمنة' : 'Verified SQL & ZIP'}</div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1">
                                    <Lock className="w-4 h-4 text-teal-600" />
                                    <div className="font-bold">{isAr ? 'صلاحيات RBAC' : 'Granular RBAC'}</div>
                                    <div className="text-slate-500">{isAr ? 'فصل تام للجلسات' : 'Dual-Guard Auth'}</div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1">
                                    <Truck className="w-4 h-4 text-teal-600" />
                                    <div className="font-bold">{isAr ? 'شحن بالمحافظة والوزن' : 'Smart Shipping'}</div>
                                    <div className="text-slate-500">{isAr ? '27 محافظة + AWB' : 'Governorates & AWB'}</div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-1">
                                    <Activity className="w-4 h-4 text-teal-600" />
                                    <div className="font-bold">{isAr ? 'فحص صحة النظام' : 'System Health'}</div>
                                    <div className="text-slate-500">{isAr ? 'تشخيص وتقارير دعم' : 'Live Checks & Export'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Verified Features Overview */}
            <section id="features" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold">{isAr ? 'جميع الإمكانيات المبنية والمختبرة فعليًا' : 'Verified Capabilities Built Into Every License'}</h2>
                    <p className="text-sm text-slate-500">
                        {isAr ? 'كل وحدة في المنصة مبنية ببنية خدمات منظمة ومغطاة باختبارات آلية.' : 'Every module is built with dedicated services, RBAC authorization, and automated tests.'}
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featureCategories.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div key={f.titleEn} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-sm">{isAr ? f.titleAr : f.titleEn}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{isAr ? f.descAr : f.descEn}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Interactive Product Showcase */}
            <section id="showcase" className="py-16 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold">{isAr ? 'استعرض أقسام المنصة تفاعليًا' : 'Interactive Platform Showcase'}</h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {(Object.keys(showcaseTabs) as Array<keyof typeof showcaseTabs>).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveShowcase(key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                    activeShowcase === key
                                        ? 'bg-teal-700 text-white border-teal-700'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {isAr ? showcaseTabs[key].labelAr : showcaseTabs[key].labelEn}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 grid md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-7 space-y-4">
                            <h3 className="text-xl font-extrabold">{isAr ? currentTab.titleAr : currentTab.titleEn}</h3>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                {(isAr ? currentTab.pointsAr : currentTab.pointsEn).map((pt) => (
                                    <li key={pt} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                        <span>{pt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:col-span-5 flex flex-col gap-3">
                            <Link href="/demo" className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold text-center">
                                {isAr ? 'جرب هذه الوحدات في الديمو' : 'Try These Modules in Live Demo'}
                            </Link>
                            <Link href="/" className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-center hover:bg-slate-50">
                                {isAr ? 'زيارة المتجر التجريبي' : 'Visit Storefront Preview'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Integrations & Requirements */}
            <section id="integrations" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8">
                <div className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-teal-600" />
                        {isAr ? 'التكاملات وبوابات الدفع' : 'Payment & Service Integrations'}
                    </h2>
                    <div className="space-y-3 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                            <div className="font-bold text-teal-700 dark:text-teal-300">
                                {isAr ? 'قابلة للتفعيل بمفاتيح التاجر (Configurable)' : 'Integrated & Configurable (Requires Merchant Keys)'}
                            </div>
                            <p className="text-slate-500">MyFatoorah, Fawry Pay, Paymob, Kashier (with signature/API verification).</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                            <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                {isAr ? 'جاهزة مباشرة بدون مفاتيح خارجية' : 'Built-In Ready Flows'}
                            </div>
                            <p className="text-slate-500">InstaPay / Vodafone Cash (Receipt upload & admin review), Bank Transfer, Cash Pickup, COD.</p>
                        </div>
                    </div>
                </div>

                <div id="requirements" className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-teal-600" />
                        {isAr ? 'متطلبات التشغيل والتثبيت' : 'Technical Requirements & Installation'}
                    </h2>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <li>• <strong>PHP:</strong> 8.3+ (<code>pdo_mysql</code>, <code>bcmath</code>, <code>mbstring</code>, <code>openssl</code>, <code>zip</code>, <code>gd</code>/<code>imagick</code>)</li>
                        <li>• <strong>Database:</strong> MySQL 8.0+ or MariaDB 10.6+</li>
                        <li>• <strong>Hosting:</strong> cPanel Shared Hosting (via <code>/install</code> wizard) or Ubuntu/Nginx VPS</li>
                        <li>• <strong>SSL:</strong> HTTPS required for live payment gateway webhooks</li>
                    </ul>
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
                        <strong>7-Step Web Installer:</strong> Upload ZIP → Visit <code>/install</code> → Check Server → Test DB → Configure Store → Run Migrations → Create Owner Account.
                    </div>
                </div>
            </section>

            {/* 5. FAQ */}
            <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <h2 className="text-2xl font-extrabold text-center">{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
                <div className="space-y-3">
                    {faqs.map((item, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-4 text-start font-bold text-sm flex items-center justify-between gap-4"
                            >
                                <span>{isAr ? item.qAr : item.qEn}</span>
                                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            {openFaq === idx && (
                                <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {isAr ? item.aAr : item.aEn}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 py-10 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="font-semibold">{productName} • v{product.version}</div>
                    <div className="flex items-center gap-5">
                        <Link href="/demo" className="hover:text-teal-700">{isAr ? 'الديمو الحي' : 'Live Demo'}</Link>
                        <Link href="/" className="hover:text-teal-700">{isAr ? 'المتجر' : 'Storefront'}</Link>
                        <Link href="/admin/login" className="hover:text-teal-700">{isAr ? 'دخول الإدارة' : 'Admin'}</Link>
                    </div>
                    <div>© {new Date().getFullYear()} {productName}</div>
                </div>
            </footer>
        </div>
    );
}
