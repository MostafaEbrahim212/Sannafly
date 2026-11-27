import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    ExternalLink,
    EyeOff,
    Globe,
    Lightbulb,
    Maximize2,
    Minimize2,
    Presentation as PresentationIcon,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    X,
} from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { SALES_SECTIONS } from '@/data/salesPresentationData';
import { useColorMode } from '@/lib/colorMode';
import { useTranslation } from '@/lib/i18n';

interface Props {
    demoEnabled: boolean;
    isPresenter: boolean;
    presenterNotes: Record<string, string> | null;
}

export default function SalesPresentation({ demoEnabled, isPresenter, presenterNotes }: Props) {
    const { locale, dir, settings, localized } = useTranslation();
    const { mode, isDark, setMode, cycleMode } = useColorMode();
    const isAr = locale === 'ar';
    const siteName = localized(settings?.site_name || 'Sannafly', settings?.site_name_ar);

    const [index, setIndex] = useState(0);
    const [presentationMode, setPresentationMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showNotes, setShowNotes] = useState(true);

    const section = SALES_SECTIONS[index];
    const progressPct = Math.round(((index + 1) / SALES_SECTIONS.length) * 100);
    const currentPresenterNote = isPresenter && presenterNotes ? presenterNotes[section.id] : null;

    const goNext = () => setIndex((i) => Math.min(SALES_SECTIONS.length - 1, i + 1));
    const goPrev = () => setIndex((i) => Math.max(0, i - 1));
    const restart = () => setIndex(0);

    const toggleFullscreen = async () => {
        if (typeof document === 'undefined') return;
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch {
            // Ignore browser fullscreen permission restrictions
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                if (isAr) goPrev();
                else goNext();
            } else if (e.key === 'ArrowLeft') {
                if (isAr) goNext();
                else goPrev();
            } else if (e.key.toLowerCase() === 'f') {
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isAr]);

    return (
        <div dir={dir} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
            <Head title={isAr ? 'العرض التقديمي التفاعلي للمبيعات' : 'Interactive Sales Presentation'} />

            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/demo" className="shrink-0">
                            <BrandLogo variant={isDark ? 'dark' : 'light'} customName={siteName} />
                        </Link>
                        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold">
                            <PresentationIcon className="w-3.5 h-3.5" />
                            {isAr ? 'وضع العرض التسويقي' : 'Sales Demo Mode'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPresentationMode((v) => !v)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                presentationMode
                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-teal-600 dark:border-teal-600'
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {presentationMode
                                ? isAr
                                    ? 'إظهار الفهرس'
                                    : 'Show Outline'
                                : isAr
                                  ? 'وضع التركيز'
                                  : 'Focus Mode'}
                        </button>

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isAr ? 'ملء الشاشة (F)' : 'Fullscreen (F)'}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>

                        <a
                            href={`/locale/${isAr ? 'en' : 'ar'}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                            <Globe className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'EN' : 'AR'}</span>
                        </a>

                        <ThemeToggle mode={mode} isDark={isDark} onChange={setMode} onCycle={cycleMode} locale={locale} />

                        <Link
                            href="/demo"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isAr ? 'إنهاء العرض' : 'Exit'}</span>
                        </Link>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-200 dark:bg-slate-800 w-full">
                    <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Section Navigation Sidebar */}
                {!presentationMode && (
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-2">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-1">
                            <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                <span>{isAr ? 'أقسام العرض' : 'Presentation Sections'}</span>
                                <span>
                                    {index + 1}/{SALES_SECTIONS.length}
                                </span>
                            </div>
                            {SALES_SECTIONS.map((s, i) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                        i === index
                                            ? 'bg-teal-700 text-white'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {isAr ? s.title.ar : s.title.en}
                                </button>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Active Slide */}
                <section className={presentationMode ? 'lg:col-span-12 space-y-6' : 'lg:col-span-8 xl:col-span-9 space-y-6'}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>
                                        {isAr
                                            ? `الشريحة ${index + 1} من ${SALES_SECTIONS.length}`
                                            : `Slide ${index + 1} of ${SALES_SECTIONS.length}`}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {isAr ? section.title.ar : section.title.en}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <a
                                    href={section.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs"
                                >
                                    <span>{isAr ? 'فتح الشاشة الحية' : 'Open Live Demo Screen'}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {!demoEnabled && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>
                                    {isAr
                                        ? 'تنبيه: Demo Mode غير مفعّل حاليًا؛ فعّله قبل السماح للعميل بتجربة الحساب المقيّد.'
                                        : 'Note: Demo Mode is currently off; enable it before sharing live demo links with prospects.'}
                                </span>
                            </div>
                        )}

                        <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                            {isAr ? section.content.ar : section.content.en}
                        </p>

                        {/* Screenshot Preview */}
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                            <img
                                src={section.screenshot}
                                alt={isAr ? section.title.ar : section.title.en}
                                className="w-full h-auto max-h-[380px] object-cover object-top"
                            />
                        </div>

                        {/* Talking Points + Demo Steps + Benefits */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 p-4 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                                    <Lightbulb className="w-4 h-4" />
                                    <span>{isAr ? 'نقاط الحديث للعميل' : 'Sales Talking Points'}</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc ps-4">
                                    {(isAr ? section.talkingPoints.ar : section.talkingPoints.en).map((pt, idx) => (
                                        <li key={idx}>{pt}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                                    <span>{isAr ? 'خطوات العرض العملي' : 'Live Demo Steps'}</span>
                                </div>
                                <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-decimal ps-4">
                                    {(isAr ? section.demoSteps.ar : section.demoSteps.en).map((st, idx) => (
                                        <li key={idx}>{st}</li>
                                    ))}
                                </ol>
                            </div>

                            <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{isAr ? 'الفائدة للعميل' : 'Customer Benefits'}</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc ps-4">
                                    {(isAr ? section.benefits.ar : section.benefits.en).map((bn, idx) => (
                                        <li key={idx}>{bn}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Presenter-Only Notes (Server-gated: never present for public visitors or demo-reviewer) */}
                        {currentPresenterNote && (
                            <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-bold text-violet-900 dark:text-violet-300">
                                        {isAr ? 'ملاحظات خاصة بالمقدّم (مخفية عن الزوار)' : 'Presenter-Only Notes (Hidden from Visitors)'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowNotes((v) => !v)}
                                        className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300"
                                    >
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>{showNotes ? (isAr ? 'إخفاء' : 'Hide') : isAr ? 'إظهار' : 'Show'}</span>
                                    </button>
                                </div>
                                {showNotes && <p className="text-xs text-violet-900/90 dark:text-violet-200">{currentPresenterNote}</p>}
                            </div>
                        )}

                        {/* Slide Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={goPrev}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                    <span>{isAr ? 'السابق' : 'Previous'}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={index === SALES_SECTIONS.length - 1}
                                    onClick={goNext}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs sm:text-sm font-bold disabled:opacity-40 hover:opacity-95"
                                >
                                    <span>{isAr ? 'القسم التالي' : 'Next Section'}</span>
                                    <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {index < SALES_SECTIONS.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1"
                                    >
                                        {isAr ? 'تخطي' : 'Skip'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={restart}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline px-2 py-1"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'إعادة من البداية' : 'Restart'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
