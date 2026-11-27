import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Globe, Lock, ShieldCheck, ShoppingBag, Sparkles, Store, UserCheck } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { useColorMode } from '@/lib/colorMode';
import { useTranslation } from '@/lib/i18n';

interface Props {
    demoEnabled: boolean;
    demoEmail: string;
}

export default function DemoHub({ demoEnabled, demoEmail }: Props) {
    const { locale, dir, settings, localized } = useTranslation();
    const { mode, isDark, setMode, cycleMode } = useColorMode();
    const isAr = locale === 'ar';
    const siteName = localized(settings?.site_name || 'CatalogFlow Commerce', settings?.site_name_ar);

    return (
        <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Head title={isAr ? 'النسخة التجريبية الحية (Live Demo)' : 'Live Interactive Demo'} />

            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <Link href="/product">
                        <BrandLogo variant={isDark ? 'dark' : 'light'} customName={siteName} />
                    </Link>
                    <div className="flex items-center gap-2.5">
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

            <main className="max-w-5xl mx-auto px-4 py-12 space-y-8">
                <div className="text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isAr ? 'بيئة عرض حية ومعزولة' : 'Interactive Sandboxed Demo'}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {isAr ? 'استكشف المتجر ولوحة التحكم مباشرة' : 'Explore Storefront & Admin Dashboard Live'}
                    </h1>
                    <p className="text-sm text-slate-500 max-w-2xl mx-auto">
                        {isAr
                            ? 'جرّب تجربة التسوق الكاملة للعميل أو ادخل إلى لوحة الإدارة بحساب مخصص للمعاينة مع حماية كاملة للبيانات.'
                            : 'Experience the full customer storefront or sign into the Admin Dashboard using a restricted Demo Reviewer account.'}
                    </p>
                </div>

                {!demoEnabled && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm text-center">
                        {isAr
                            ? 'ملاحظة: وضع العرض التجريبي (Demo Mode) غير مفعّل حاليًا على هذا التثبيت. يمكن للمالك تفعيله من الإعدادات أو APP_DEMO_MODE=true.'
                            : 'Note: Demo Mode is currently disabled on this installation. Owners can enable it via Settings or APP_DEMO_MODE=true.'}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Storefront Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between gap-6 shadow-sm">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                                <Store className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">{isAr ? 'واجهة المتجر (Storefront)' : 'Customer Storefront'}</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {isAr
                                    ? 'تصفح المنتجات، الخيارات، السلة، الكوبونات، الشحن بالمحافظات والوزن، وتتبع الطلبات بالعربي والإنجليزي.'
                                    : 'Browse products, variations, cart, coupons, governorate & weight shipping, and order tracking in AR/EN.'}
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {isAr ? 'دعم RTL/LTR والوضع الداكن' : 'Full RTL/LTR & Dark Mode'}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {isAr ? 'دفع تجريبي محاكى بدون خصم حقيقي' : 'Simulated checkout (no real payments)'}</li>
                            </ul>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{isAr ? 'فتح المتجر التجريبي' : 'Open Storefront'}</span>
                            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        </Link>
                    </div>

                    {/* Demo Admin Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between gap-6 shadow-sm">
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">{isAr ? 'لوحة تحكم الإدارة (Demo Admin)' : 'Admin Dashboard (Demo Reviewer)'}</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {isAr
                                    ? 'استعرض لوحة التحكم، المنتجات، المخزون، الطلبات، التحليلات، المخصص، وسجلات التدقيق بحساب مخصص للمعاينة.'
                                    : 'Explore Dashboard, Products, Inventory, Orders, Analytics, Customizer, and Audit Logs with a restricted reviewer role.'}
                            </p>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                                <div className="font-mono">Account: <strong>{demoEmail}</strong></div>
                                <div className="text-slate-500 flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{isAr ? 'محمي بـ DemoModeGuard: لا يمكن تعديل الأسرار أو الحذف أو الاستعادة.' : 'Protected by DemoModeGuard: secrets, restore, updates & deletions blocked.'}</span>
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
                                <span>{isAr ? 'دخول فوري كـ Demo Admin' : 'One-Click Demo Admin Login'}</span>
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
            </main>
        </div>
    );
}
