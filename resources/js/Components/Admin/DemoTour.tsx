import React, { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Compass,
    ExternalLink,
    LogOut,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    X,
} from 'lucide-react';

interface TourStep {
    href: string;
    enTitle: string;
    arTitle: string;
    enBody: string;
    arBody: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        href: '/admin',
        enTitle: '1. Dashboard Overview',
        arTitle: '1. نظرة عامة على لوحة التحكم',
        enBody: 'Monitor total products, low-stock alerts, categories, orders, and live notifications from one screen.',
        arBody: 'راقب إجمالي المنتجات، تنبيهات نقص المخزون، الأقسام، الطلبات، والإشعارات الفورية من شاشة واحدة.',
    },
    {
        href: '/admin/products',
        enTitle: '2. Products & Catalog',
        arTitle: '2. المنتجات والكتالوج',
        enBody: 'Search by name or SKU, filter by status or category, and inspect multi-tier pricing & image galleries.',
        arBody: 'ابحث بالاسم أو رمز SKU، فلتر حسب الحالة أو القسم، واستعرض الأسعار المتعددة ومعارض الصور.',
    },
    {
        href: '/admin/categories',
        enTitle: '3. Categories Hierarchy',
        arTitle: '3. شجرة الأقسام',
        enBody: 'Organize products into parent and child categories with full Arabic & English labels.',
        arBody: 'نظّم المنتجات في أقسام رئيسية وفرعية بأسماء عربية وإنجليزية متكاملة.',
    },
    {
        href: '/admin/inventory',
        enTitle: '4. Inventory & Stock Ledger',
        arTitle: '4. المخزون وسجل الحركات',
        enBody: 'Track live stock quantities and inspect immutable StockMovement audit rows.',
        arBody: 'تابع الكميات المتاحة وراجع سجل حركات المخزون الدقيق.',
    },
    {
        href: '/admin/orders',
        enTitle: '5. Orders & Fulfillment',
        arTitle: '5. الطلبات ودورة التنفيذ',
        enBody: 'Explore the order pipeline (Pending → Confirmed → Processing → Shipped → Delivered), invoices, and labels.',
        arBody: 'استكشف دورة الطلب من الانتظار حتى التسليم مع الفواتير وبوالص الشحن.',
    },
    {
        href: '/admin/analytics',
        enTitle: '6. Sales Analytics',
        arTitle: '6. تحليلات المبيعات',
        enBody: 'Review revenue trends, order status distribution, top products, and exportable CSV reports.',
        arBody: 'راجع مؤشرات الإيرادات وتوزيع الحالات وأكثر المنتجات مبيعًا وتقارير CSV.',
    },
    {
        href: '/admin/customizer/themes',
        enTitle: '7. Theme Presets',
        arTitle: '7. قوالب الثيم والمظهر',
        enBody: 'Browse saved white-label theme presets and explore Dark/Light mode styling.',
        arBody: 'استعرض قوالب الثيم الجاهزة وتبديل الوضع الداكن والفاتح.',
    },
    {
        href: '/admin/system/audit-logs',
        enTitle: '8. Security & Audit Logs',
        arTitle: '8. الأمان وسجل التدقيق',
        enBody: 'Every administrative action is logged with user, timestamp, and entity details. Sensitive mutations are blocked in Demo Mode.',
        arBody: 'يُوثّق كل إجراء إداري في سجل التدقيق، وتُمنع التعديلات الحساسة تلقائيًا في وضع الديمو.',
    },
];

const TOUR_DISMISSED_KEY = 'cf_demo_tour_dismissed';

export default function DemoTour({
    demoMode,
    isDemoReviewer,
    locale,
}: {
    demoMode: boolean;
    isDemoReviewer: boolean;
    locale: string;
}) {
    const isAr = locale === 'ar';
    const [tourOpen, setTourOpen] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
        if (!demoMode || !isDemoReviewer || typeof window === 'undefined') return;
        const dismissed = sessionStorage.getItem(TOUR_DISMISSED_KEY) === '1';
        if (!dismissed) {
            setTourOpen(true);
        }
    }, [demoMode, isDemoReviewer]);

    if (!demoMode) return null;

    const currentStep = TOUR_STEPS[stepIdx];

    const closeTour = () => {
        setTourOpen(false);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(TOUR_DISMISSED_KEY, '1');
        }
    };

    const restartTour = () => {
        setStepIdx(0);
        setTourOpen(true);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(TOUR_DISMISSED_KEY);
        }
    };

    const goToStep = (nextIndex: number) => {
        const clamped = Math.max(0, Math.min(TOUR_STEPS.length - 1, nextIndex));
        setStepIdx(clamped);
        router.visit(TOUR_STEPS[clamped].href, { preserveState: true });
    };

    return (
        <>
            {/* Persistent Demo Mode Banner */}
            <div className="no-print bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/70 px-4 lg:px-8 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-amber-900 dark:text-amber-200">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 font-bold">
                            <Sparkles className="w-3 h-3" />
                            {isAr ? 'وضع الديمو (Demo Mode)' : 'Demo Mode'}
                        </span>
                        {isDemoReviewer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-800 font-semibold">
                                {isAr ? 'حساب مراجعة مقيّد' : 'Demo Reviewer (Read-Only)'}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            {isAr
                                ? 'الإعدادات، الحذف، النسخ الاحتياطي، التحديثات، ومفاتيح الدفع محمية ضد التعديل.'
                                : 'Settings, deletions, backups, updates, and payment credentials are protected.'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={restartTour}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-teal-700 font-semibold hover:opacity-90"
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>{isAr ? 'الجولة الإرشادية' : 'Guided Tour'}</span>
                        </button>
                        <Link
                            href="/demo"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 font-semibold hover:bg-amber-100/50"
                        >
                            <span>{isAr ? 'بوابة الديمو' : 'Demo Hub'}</span>
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post('/admin/logout')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 font-semibold hover:bg-rose-50"
                        >
                            <LogOut className="w-3 h-3" />
                            <span>{isAr ? 'خروج' : 'Exit Demo'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightweight Floating Guided Tour */}
            {tourOpen && currentStep && (
                <div className="no-print fixed bottom-5 end-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl bg-slate-900 text-white border border-teal-500/40 shadow-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
                            <Compass className="w-4 h-4 shrink-0" />
                            <span>
                                {isAr
                                    ? `جولة الديمو (${stepIdx + 1} / ${TOUR_STEPS.length})`
                                    : `Demo Tour (${stepIdx + 1} / ${TOUR_STEPS.length})`}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={closeTour}
                            aria-label="Close tour"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div>
                        <h3 className="font-bold text-sm">{isAr ? currentStep.arTitle : currentStep.enTitle}</h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {isAr ? currentStep.arBody : currentStep.enBody}
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={stepIdx === 0}
                                onClick={() => goToStep(stepIdx - 1)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold disabled:opacity-40 hover:bg-slate-700"
                            >
                                <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                                <span>{isAr ? 'السابق' : 'Prev'}</span>
                            </button>
                            {stepIdx < TOUR_STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => goToStep(stepIdx + 1)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-xs font-bold hover:bg-teal-500"
                                >
                                    <span>{isAr ? 'التالي' : 'Next'}</span>
                                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={restartTour}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-xs font-bold hover:bg-teal-500"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'إعادة الجولة' : 'Restart'}</span>
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={closeTour}
                            className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
                        >
                            {isAr ? 'تخطي' : 'Skip'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
