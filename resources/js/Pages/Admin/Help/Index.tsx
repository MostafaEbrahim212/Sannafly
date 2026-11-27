import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bookmark,
    BookmarkCheck,
    BookOpen,
    CheckCircle2,
    Circle,
    ExternalLink,
    HelpCircle,
    Lightbulb,
    Search,
    Sparkles,
    Wrench,
    X,
    ZoomIn,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { HELP_CATEGORIES, HELP_FAQS, HELP_GUIDES, type HelpGuide, type HelpLevel } from '@/data/helpGuides';
import { useTranslation } from '@/lib/i18n';

const READ_KEY = 'cf_help_read_ids';
const BOOKMARK_KEY = 'cf_help_bookmarks';

const LEVEL_META: Record<HelpLevel, { en: string; ar: string; cls: string }> = {
    beginner: {
        en: 'Beginner',
        ar: 'مبتدئ',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
    intermediate: {
        en: 'Intermediate',
        ar: 'متوسط',
        cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    },
    advanced: {
        en: 'Advanced',
        ar: 'متقدم',
        cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
    },
};

export default function HelpIndex() {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [level, setLevel] = useState<'all' | HelpLevel>('all');
    const [onlyBookmarked, setOnlyBookmarked] = useState(false);
    const [activeTab, setActiveTab] = useState<'guides' | 'faq'>('guides');
    const [selectedId, setSelectedId] = useState<string>(HELP_GUIDES[0].id);
    const [zoomSrc, setZoomSrc] = useState<string | null>(null);

    const [readIds, setReadIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
        } catch {
            return [];
        }
    });

    const [bookmarks, setBookmarks] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(READ_KEY, JSON.stringify(readIds));
        }
    }, [readIds]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
        }
    }, [bookmarks]);

    const filteredGuides = useMemo(() => {
        const q = query.trim().toLowerCase();
        return HELP_GUIDES.filter((g) => {
            if (category !== 'all' && g.category !== category) return false;
            if (level !== 'all' && g.level !== level) return false;
            if (onlyBookmarked && !bookmarks.includes(g.id)) return false;
            if (!q) return true;
            const hay = `${g.title.en} ${g.title.ar} ${g.summary.en} ${g.summary.ar} ${g.routePath}`.toLowerCase();
            return hay.includes(q);
        });
    }, [query, category, level, onlyBookmarked, bookmarks]);

    const activeGuide: HelpGuide | undefined =
        filteredGuides.find((g) => g.id === selectedId) || filteredGuides[0] || HELP_GUIDES[0];

    const toggleRead = (id: string) => {
        setReadIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleBookmark = (id: string) => {
        setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const progressPct = Math.round((readIds.length / HELP_GUIDES.length) * 100);

    return (
        <AdminLayout title={isAr ? 'مركز التعلم والمساعدة' : 'Learning Center & Guide'}>
            <Head title={isAr ? 'مركز التعلم والمساعدة' : 'Learning Center'} />

            {/* Header + Progress Bar */}
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-medium mb-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isAr ? 'دليل المالك والتدريب التفاعلي' : 'Product Owner Guide & Training'}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">
                            {isAr ? 'مركز التعلم الشامل للمنصة' : 'Interactive Learning Center'}
                        </h1>
                        <p className="text-sm text-slate-300 mt-1">
                            {isAr
                                ? 'شرح عملي خطوة بخطوة لكل شاشات لوحة التحكم بالصور الحقيقية وخارطة التعلم.'
                                : 'Step-by-step operational guides with real screenshots, examples, and troubleshooting.'}
                        </p>
                    </div>

                    <div className="bg-white/10 border border-white/15 rounded-xl p-4 min-w-64">
                        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                            <span>{isAr ? 'تقدّمك في التعلم' : 'Learning Progress'}</span>
                            <span>
                                {readIds.length}/{HELP_GUIDES.length} ({progressPct}%)
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                            <div
                                className="h-full bg-teal-400 transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Switch + Search & Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('guides')}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                                activeTab === 'guides'
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            {isAr ? 'الأدلة التفاعلية' : 'Interactive Guides'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('faq')}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                                activeTab === 'faq'
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            {isAr ? 'الأسئلة الشائعة وحل المشاكل' : 'FAQ & Troubleshooting'}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={isAr ? 'ابحث في الأدلة...' : 'Search guides...'}
                                className="ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm w-60"
                            />
                        </div>

                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value as any)}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        >
                            <option value="all">{isAr ? 'كل المستويات' : 'All Levels'}</option>
                            <option value="beginner">{isAr ? 'مبتدئ' : 'Beginner'}</option>
                            <option value="intermediate">{isAr ? 'متوسط' : 'Intermediate'}</option>
                            <option value="advanced">{isAr ? 'متقدم' : 'Advanced'}</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setOnlyBookmarked((v) => !v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm ${
                                onlyBookmarked
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            {isAr ? `المحفوظات (${bookmarks.length})` : `Bookmarks (${bookmarks.length})`}
                        </button>
                    </div>
                </div>

                {activeTab === 'guides' && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {HELP_CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategory(c.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    category === c.id
                                        ? 'bg-slate-900 text-white dark:bg-teal-600'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {isAr ? c.ar : c.en}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {activeTab === 'faq' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {HELP_FAQS.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5"
                        >
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                {isAr ? item.q.ar : item.q.en}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {isAr ? item.a.ar : item.a.en}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Guide List */}
                    <div className="lg:col-span-4 space-y-2">
                        {filteredGuides.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center text-sm text-slate-500">
                                {isAr ? 'لا توجد أدلة مطابقة للبحث.' : 'No guides match your filter.'}
                            </div>
                        ) : (
                            filteredGuides.map((g) => {
                                const isSelected = activeGuide?.id === g.id;
                                const isRead = readIds.includes(g.id);
                                const isBookmarked = bookmarks.includes(g.id);
                                const lm = LEVEL_META[g.level];
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => setSelectedId(g.id)}
                                        className={`w-full text-start rounded-xl border p-3.5 transition-all ${
                                            isSelected
                                                ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 shadow-xs'
                                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {isRead ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                                )}
                                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                    {isAr ? g.title.ar : g.title.en}
                                                </span>
                                            </div>
                                            {isBookmarked && <BookmarkCheck className="w-4 h-4 text-amber-500 shrink-0" />}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {isAr ? g.summary.ar : g.summary.en}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${lm.cls}`}>
                                                {isAr ? lm.ar : lm.en}
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-400">{g.routePath}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Active Guide Reader */}
                    {activeGuide && (
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${LEVEL_META[activeGuide.level].cls}`}>
                                            {isAr ? LEVEL_META[activeGuide.level].ar : LEVEL_META[activeGuide.level].en}
                                        </span>
                                        <Link
                                            href={activeGuide.routePath}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                                        >
                                            <span>{isAr ? 'فتح الصفحة' : 'Open Screen'}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {isAr ? activeGuide.title.ar : activeGuide.title.en}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleBookmark(activeGuide.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        {bookmarks.includes(activeGuide.id) ? (
                                            <BookmarkCheck className="w-4 h-4 text-amber-500" />
                                        ) : (
                                            <Bookmark className="w-4 h-4" />
                                        )}
                                        {isAr ? 'حفظ' : 'Bookmark'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleRead(activeGuide.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                            readIds.includes(activeGuide.id)
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-900 dark:bg-teal-700 text-white'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {readIds.includes(activeGuide.id)
                                            ? isAr
                                                ? 'مكتمل'
                                                : 'Completed'
                                            : isAr
                                              ? 'تحديد كمقروء'
                                              : 'Mark as Read'}
                                    </button>
                                </div>
                            </div>

                            {activeGuide.screenshot && (
                                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                    <img
                                        src={activeGuide.screenshot}
                                        alt={isAr ? activeGuide.title.ar : activeGuide.title.en}
                                        className="w-full h-auto max-h-80 object-cover object-top"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setZoomSrc(activeGuide.screenshot!)}
                                        className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs font-medium hover:bg-slate-900"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        {isAr ? 'تكبير الصورة' : 'Zoom Screenshot'}
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        {isAr ? 'ما هو هذا القسم؟' : 'What is this section?'}
                                    </h3>
                                    <p className="text-sm text-slate-700 dark:text-slate-200">{isAr ? activeGuide.what.ar : activeGuide.what.en}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                        {isAr ? 'لماذا أحتاجه؟' : 'Why do I need it?'}
                                    </h3>
                                    <p className="text-sm text-slate-700 dark:text-slate-200">{isAr ? activeGuide.why.ar : activeGuide.why.en}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2.5">
                                    {isAr ? 'خطوات الاستخدام بالترتيب' : 'Step-by-Step Instructions'}
                                </h3>
                                <ol className="space-y-2">
                                    {(isAr ? activeGuide.steps.ar : activeGuide.steps.en).map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 mb-1">
                                        <Lightbulb className="w-4 h-4" />
                                        {isAr ? 'مثال عملي' : 'Practical Example'}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{isAr ? activeGuide.example.ar : activeGuide.example.en}</p>
                                </div>

                                <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isAr ? 'النتيجة المتوقعة' : 'What Happens Next'}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{isAr ? activeGuide.result.ar : activeGuide.result.en}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {isAr ? 'ملاحظات مهمة' : 'Important Notes'}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{isAr ? activeGuide.notes.ar : activeGuide.notes.en}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        <Wrench className="w-4 h-4" />
                                        {isAr ? 'حل المشاكل الشائعة' : 'Troubleshooting'}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        {isAr ? activeGuide.troubleshooting.ar : activeGuide.troubleshooting.en}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Zoom Modal */}
            {zoomSrc && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setZoomSrc(null)}
                >
                    <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setZoomSrc(null)}
                            className="absolute -top-10 end-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={zoomSrc} alt="Screenshot Preview" className="w-full h-auto rounded-xl shadow-2xl border border-white/15" />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
