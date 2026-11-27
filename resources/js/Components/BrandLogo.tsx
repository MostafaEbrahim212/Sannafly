import React from 'react';
import { useTranslation } from '@/lib/i18n';

interface BrandLogoProps {
    variant?: 'light' | 'dark';
    showText?: boolean;
    customName?: string;
    logoUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
}

export default function BrandLogo({ variant = 'light', showText = true, customName, logoUrl, size = 'md' }: BrandLogoProps) {
    const { locale } = useTranslation();
    const isDarkBg = variant === 'dark';

    const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
    const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

    const bar1 = isDarkBg ? '#109684' : '#063F3C';
    const bar2 = isDarkBg ? '#2DD4BF' : '#109684';
    const bar3 = isDarkBg ? '#E9F0ED' : '#0A5C57';

    const displayName = customName || (locale === 'ar' ? 'متجري' : 'MyStore');

    if (logoUrl) {
        return (
            <span className="inline-flex items-center gap-2.5 select-none">
                <img src={logoUrl} alt={displayName} className={`${iconSize} object-contain rounded-lg shrink-0`} />
                {showText && (
                    <span className={`font-extrabold tracking-tight ${textSize} ${isDarkBg ? 'text-white' : 'text-[#0A5C57]'}`}>
                        {displayName}
                    </span>
                )}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2.5 select-none">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${iconSize} shrink-0`}>
                <circle cx="31" cy="8.5" r="4" fill="#F6A21E" />
                <rect x="13" y="13" width="16" height="5" rx="2.5" fill={bar1} />
                <rect x="8" y="20.5" width="24" height="5" rx="2.5" fill={bar2} />
                <rect x="4" y="28" width="32" height="5.5" rx="2.75" fill={bar3} />
            </svg>
            {showText && (
                <span className={`font-extrabold tracking-tight ${textSize} ${isDarkBg ? 'text-white' : 'text-[#0A5C57]'}`}>
                    {displayName}
                </span>
            )}
        </span>
    );
}
