import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ColorMode } from '@/lib/colorMode';

interface ThemeToggleProps {
    mode: ColorMode;
    isDark: boolean;
    onChange: (mode: ColorMode) => void;
    onCycle?: () => void;
    locale?: string;
    variant?: 'segmented' | 'compact';
}

export default function ThemeToggle({
    mode,
    isDark,
    onChange,
    onCycle,
    locale = 'en',
    variant = 'segmented',
}: ThemeToggleProps) {
    const isAr = locale === 'ar';

    if (variant === 'compact') {
        const label =
            mode === 'system'
                ? isAr
                    ? 'تلقائي (النظام)'
                    : 'System'
                : mode === 'dark'
                  ? isAr
                      ? 'الوضع الداكن'
                      : 'Dark'
                  : isAr
                    ? 'الوضع الفاتح'
                    : 'Light';

        const Icon = mode === 'system' ? Monitor : isDark ? Moon : Sun;

        return (
            <button
                type="button"
                onClick={onCycle ?? (() => onChange(isDark ? 'light' : 'dark'))}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                title={isAr ? `المظهر: ${label}` : `Theme: ${label}`}
                aria-label={isAr ? 'تبديل المظهر' : 'Toggle theme'}
            >
                <Icon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">{label}</span>
            </button>
        );
    }

    const options: Array<{ value: ColorMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
        { value: 'light', label: isAr ? 'فاتح' : 'Light', icon: Sun },
        { value: 'dark', label: isAr ? 'داكن' : 'Dark', icon: Moon },
        { value: 'system', label: isAr ? 'النظام' : 'System', icon: Monitor },
    ];

    return (
        <div
            role="group"
            aria-label={isAr ? 'اختيار المظهر' : 'Color theme'}
            className="inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/90"
        >
            {options.map((opt) => {
                const Icon = opt.icon;
                const active = mode === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        title={opt.label}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            active
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
