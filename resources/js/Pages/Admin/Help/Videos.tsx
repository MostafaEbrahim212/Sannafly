import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Film,
    FileText,
    PlayCircle,
    Search,
    Terminal,
    Video,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { VIDEO_CATEGORIES, VIDEO_TUTORIALS, type VideoCategory, type VideoTutorial } from '@/data/videoTutorials';
import { useTranslation } from '@/lib/i18n';

const WATCHED_KEY = 'cf_help_watched_videos';

export default function HelpVideos() {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<VideoCategory>('all');
    const [difficulty, setDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [selectedId, setSelectedId] = useState<string>(VIDEO_TUTORIALS[0].id);

    const [watchedIds, setWatchedIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(WATCHED_KEY, JSON.stringify(watchedIds));
        }
    }, [watchedIds]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return VIDEO_TUTORIALS.filter((v) => {
            if (category !== 'all' && v.category !== category) return false;
            if (difficulty !== 'all' && v.difficulty !== difficulty) return false;
            if (!q) return true;
            return `${v.title.en} ${v.title.ar} ${v.objective.en} ${v.objective.ar}`.toLowerCase().includes(q);
        });
    }, [query, category, difficulty]);

    const activeIdx = Math.max(0, filtered.findIndex((v) => v.id === selectedId));
    const activeVideo: VideoTutorial = filtered[activeIdx] || filtered[0] || VIDEO_TUTORIALS[0];

    const toggleWatched = (id: string) => {
        setWatchedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const recordedCount = VIDEO_TUTORIALS.filter((v) => v.status === 'recorded').length;
    const watchedPct = Math.round((watchedIds.length / VIDEO_TUTORIALS.length) * 100);

    return (
        <AdminLayout title={isAr ? 'مكتبة الفيديو التعليمية' : 'Video Tutorial Library'}>
            <Head title={isAr ? 'مكتبة الفيديو التعليمية' : 'Video Tutorial Library'} />

            {/* Header */}
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-medium mb-2">
                        <Film className="w-3.5 h-3.5" />
                        <span>
                            {isAr
                                ? `${recordedCount} فيديو مسجّل فعليًا • ${VIDEO_TUTORIALS.length - recordedCount} جاهز للتسجيل`
                                : `${recordedCount} Recorded Videos • ${VIDEO_TUTORIALS.length - recordedCount} Ready to Record`}
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold">
                        {isAr ? 'مكتبة الفيديوهات وسيناريوهات التدريب' : 'Video Tutorial Library & Production Scripts'}
                    </h1>
                    <p className="text-sm text-slate-300 mt-1">
                        {isAr
                            ? 'شاهد الدروس المسجّلة مباشرة أو استخدم النصوص والـ Storyboard لتسجيل باقي الدروس.'
                            : 'Watch recorded walkthroughs directly or follow the ready-to-record scripts & storyboards.'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/help"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
                    >
                        {isAr ? 'الأدلة النصية' : 'Written Guides'}
                    </Link>
                    <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-48">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span>{isAr ? 'نسبة الإنجاز' : 'Progress'}</span>
                            <span>
                                {watchedIds.length}/{VIDEO_TUTORIALS.length} ({watchedPct}%)
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-400" style={{ width: `${watchedPct}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isAr ? 'ابحث في الدروس...' : 'Search tutorials...'}
                            className="ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm w-64"
                        />
                    </div>

                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    >
                        <option value="all">{isAr ? 'كل المستويات' : 'All Levels'}</option>
                        <option value="beginner">{isAr ? 'مبتدئ' : 'Beginner'}</option>
                        <option value="intermediate">{isAr ? 'متوسط' : 'Intermediate'}</option>
                        <option value="advanced">{isAr ? 'متقدم' : 'Advanced'}</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {VIDEO_CATEGORIES.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategory(c.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                category === c.id
                                    ? 'bg-slate-900 text-white dark:bg-teal-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {isAr ? c.ar : c.en}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List */}
                <div className="lg:col-span-4 space-y-2 max-h-[750px] overflow-y-auto pe-1">
                    {filtered.map((v) => {
                        const isSelected = activeVideo.id === v.id;
                        const isWatched = watchedIds.includes(v.id);
                        return (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedId(v.id)}
                                className={`w-full text-start rounded-xl border p-3.5 transition-all ${
                                    isSelected
                                        ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {v.status === 'recorded' ? (
                                            <PlayCircle className="w-4 h-4 text-teal-600 shrink-0" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                        )}
                                        <span className="font-semibold text-sm truncate">{isAr ? v.title.ar : v.title.en}</span>
                                    </div>
                                    {isWatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px]">
                                    <span
                                        className={`px-2 py-0.5 rounded-full font-semibold ${
                                            v.status === 'recorded'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                        }`}
                                    >
                                        {v.status === 'recorded'
                                            ? isAr
                                                ? 'فيديو مسجّل'
                                                : 'Recorded'
                                            : isAr
                                              ? 'جاهز للتسجيل (نص)'
                                              : 'Script Ready'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {v.duration}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Active Video / Script Panel */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                            <h2 className="text-xl font-bold">{isAr ? activeVideo.title.ar : activeVideo.title.en}</h2>
                            <p className="text-sm text-slate-500 mt-1">{isAr ? activeVideo.objective.ar : activeVideo.objective.en}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={activeVideo.routePath}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                            >
                                <span>{isAr ? 'فتح الشاشة' : 'Open Screen'}</span>
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => toggleWatched(activeVideo.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    watchedIds.includes(activeVideo.id)
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-900 dark:bg-teal-700 text-white'
                                }`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{watchedIds.includes(activeVideo.id) ? (isAr ? 'تمت المشاهدة' : 'Completed') : isAr ? 'تحديد كمكتمل' : 'Mark Complete'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Real Video Player ONLY when recorded, otherwise clear Script Ready notice */}
                    {activeVideo.status === 'recorded' && activeVideo.videoUrl ? (
                        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                            <video key={activeVideo.videoUrl} controls className="w-full max-h-[420px]" poster={activeVideo.screenshot}>
                                <source src={activeVideo.videoUrl} type="video/webm" />
                            </video>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-5 space-y-2">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                                <Video className="w-4 h-4" />
                                <span>
                                    {isAr
                                        ? 'هذا الدرس جاهز للتسجيل (نص + Storyboard متاحين بالأسفل)'
                                        : 'Ready-to-Record Tutorial (Script & Storyboard Provided Below)'}
                                </span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                {isAr
                                    ? 'لم يتم تسجيل فيديو لهذا الدرس بعد. يمكنك اتباع النص بالأسفل أو استخدام شاشة المعاينة المرجعية لتسجيله.'
                                    : 'No video file has been recorded for this lesson yet. Follow the narration script and storyboard below to record it.'}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 text-teal-300 px-3 py-2 rounded-lg">
                                <Terminal className="w-3.5 h-3.5 shrink-0" />
                                <span>node scripts/record-tutorials.mjs {activeVideo.id}</span>
                            </div>
                        </div>
                    )}

                    {/* Script */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-1.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isAr ? 'نص التعليق الصوتي (Narration Script)' : 'Narration Script'}
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                            {isAr ? activeVideo.script.ar : activeVideo.script.en}
                        </p>
                    </div>

                    {/* Storyboard */}
                    <div>
                        <h3 className="text-sm font-bold mb-2">{isAr ? 'مشاهد التصوير (Storyboard)' : 'Screen Recording Storyboard'}</h3>
                        <div className="space-y-2">
                            {activeVideo.storyboard.map((sc) => (
                                <div key={sc.scene} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                                    <div>
                                        <span className="font-bold text-teal-700 dark:text-teal-400">#{sc.scene}</span>{' '}
                                        <span className="font-mono text-slate-500">({sc.screen})</span> — {sc.action}
                                    </div>
                                    <span className="font-mono text-slate-400 shrink-0">{sc.duration}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Prev / Next */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            disabled={activeIdx <= 0}
                            onClick={() => activeIdx > 0 && setSelectedId(filtered[activeIdx - 1].id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
                        >
                            <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                            <span>{isAr ? 'الدرس السابق' : 'Previous'}</span>
                        </button>
                        <button
                            type="button"
                            disabled={activeIdx >= filtered.length - 1}
                            onClick={() => activeIdx < filtered.length - 1 && setSelectedId(filtered[activeIdx + 1].id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-teal-600 text-white text-xs font-bold disabled:opacity-40"
                        >
                            <span>{isAr ? 'الدرس التالي' : 'Next'}</span>
                            <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
