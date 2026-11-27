import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Clock, Home, Lock, RefreshCw, Search, ServerCrash, Wrench } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import { useColorMode } from '@/lib/colorMode';
import { useTranslation } from '@/lib/i18n';
import { applyThemeSettings } from '@/lib/theme';
import type { PageProps } from '@/types';

interface Props {
    status: number;
    requestId?: string | null;
}

const ERROR_META: Record<
    number,
    {
        icon: React.ComponentType<{ className?: string }>;
        titleEn: string;
        titleAr: string;
        descEn: string;
        descAr: string;
    }
> = {
    403: {
        icon: Lock,
        titleEn: 'Access Restricted',
        titleAr: 'غير مصرح بالوصول',
        descEn: 'You do not have permission to view this page or perform this action.',
        descAr: 'عذرًا، لا تملك الصلاحية الكافية للوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء.',
    },
    404: {
        icon: Search,
        titleEn: 'Page Not Found',
        titleAr: 'الصفحة غير موجودة',
        descEn: 'The page or product you are looking for may have been moved or no longer exists.',
        descAr: 'الصفحة أو المنتج الذي تبحث عنه غير موجود أو تم نقله إلى رابط آخر.',
    },
    419: {
        icon: Clock,
        titleEn: 'Session Expired',
        titleAr: 'انتهت صلاحية الجلسة',
        descEn: 'Your security token expired due to inactivity. Refresh the page and try again.',
        descAr: 'انتهت صلاحية الجلسة الأمنية، يرجى تحديث الصفحة والمحاولة مرة أخرى.',
    },
    429: {
        icon: AlertTriangle,
        titleEn: 'Too Many Requests',
        titleAr: 'طلبات كثيرة جدًا',
        descEn: 'You have sent too many requests in a short time. Please wait a moment and retry.',
        descAr: 'تم إرسال عدد كبير من الطلبات في وقت قصير، يرجى الانتظار قليلًا ثم المحاولة مجددًا.',
    },
    500: {
        icon: ServerCrash,
        titleEn: 'Unexpected Server Error',
        titleAr: 'حدث خطأ غير متوقع في الخادم',
        descEn: 'Something went wrong on our end. Our team has logged the issue and is looking into it.',
        descAr: 'حدث خلل تقني مؤقت لدينا، تم تسجيل المشكلة تلقائيًا وجاري العمل على حلها.',
    },
    503: {
        icon: Wrench,
        titleEn: 'Scheduled Maintenance',
        titleAr: 'الموقع تحت الصيانة حاليًا',
        descEn: 'We are performing quick updates to improve your experience. Please check back shortly.',
        descAr: 'نقوم حاليًا ببعض التحديثات السريعة لتحسين تجربتك، سنعود للعمل خلال دقائق.',
    },
};

export default function ErrorPage({ status, requestId }: Props) {
    const { settings } = usePage<PageProps>().props;
    const { locale, dir, localized } = useTranslation();
    const { isDark } = useColorMode();
    const isAr = locale === 'ar';

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = locale;
    }, [dir, locale]);

    useEffect(() => {
        if (settings) {
            applyThemeSettings(settings);
        }
    }, [settings]);

    const meta = ERROR_META[status] || ERROR_META[500];
    const Icon = meta.icon;
    const primaryColor = settings?.primary_color || '#0A5C57';
    const accentColor = settings?.accent_color || '#F6A21E';
    const siteName = localized(settings?.site_name || 'MyStore', settings?.site_name_ar);
    const radiusClass =
        settings?.border_radius === 'sharp'
            ? 'rounded-lg'
            : settings?.border_radius === 'pill'
              ? 'rounded-3xl'
              : 'rounded-2xl';

    const showReload = status === 419 || status === 503 || status === 429;

    return (
        <div dir={dir} className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden">
            <Head title={`${status} — ${isAr ? meta.titleAr : meta.titleEn}`} />

            {/* Subtle Themed Ambient Glows */}
            <div
                className="pointer-events-none absolute -top-32 -end-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
                style={{ backgroundColor: primaryColor }}
            />
            <div
                className="pointer-events-none absolute -bottom-32 -start-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
                style={{ backgroundColor: accentColor }}
            />

            <div className="relative z-10 w-full max-w-lg text-center space-y-6">
                <Link href="/" className="inline-flex justify-center">
                    <BrandLogo
                        variant={isDark ? 'dark' : 'light'}
                        customName={siteName}
                        logoUrl={isDark ? settings?.brand_logo_dark || settings?.brand_logo : settings?.brand_logo}
                        size="lg"
                    />
                </Link>

                <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-8 sm:p-10 space-y-5 ${radiusClass}`}>
                    <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                    >
                        <Icon className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <div className="text-5xl font-black tracking-tight font-mono" style={{ color: primaryColor }}>
                            {status}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold">
                            {isAr ? meta.titleAr : meta.titleEn}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isAr ? meta.descAr : meta.descEn}
                        </p>
                    </div>

                    {requestId && (
                        <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                            Ref: {requestId}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {showReload ? (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>{isAr ? 'تحديث الصفحة' : 'Refresh Page'}</span>
                            </button>
                        ) : (
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Home className="w-4 h-4" />
                                <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
                            </Link>
                        )}

                        {status !== 503 && (
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                <span>{isAr ? 'الرجوع للخلف' : 'Go Back'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
