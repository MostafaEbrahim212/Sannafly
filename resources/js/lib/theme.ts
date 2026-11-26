export interface ThemeSettings {
    primary_color?: string;
    accent_color?: string;
    text_color?: string;
    theme_surface?: string;
    border_radius?: string;
    font_preset?: string;
}

function hexToRgb(hex: string): [number, number, number] | null {
    const clean = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
    ];
}

function mixRgb(a: [number, number, number], b: [number, number, number], weight: number): string {
    const r = Math.round(a[0] * (1 - weight) + b[0] * weight);
    const g = Math.round(a[1] * (1 - weight) + b[1] * weight);
    const bl = Math.round(a[2] * (1 - weight) + b[2] * weight);
    return `rgb(${r} ${g} ${bl})`;
}

export function applyThemeSettings(settings: ThemeSettings | Record<string, any>): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const primaryHex = settings.primary_color || '#0A5C57';
    const primary = hexToRgb(primaryHex);
    if (primary) {
        const white: [number, number, number] = [255, 255, 255];
        const black: [number, number, number] = [6, 63, 60];

        root.style.setProperty('--color-teal-50', mixRgb(primary, white, 0.93));
        root.style.setProperty('--color-teal-100', mixRgb(primary, white, 0.84));
        root.style.setProperty('--color-teal-200', mixRgb(primary, white, 0.68));
        root.style.setProperty('--color-teal-300', mixRgb(primary, white, 0.48));
        root.style.setProperty('--color-teal-400', mixRgb(primary, white, 0.26));
        root.style.setProperty('--color-teal-500', mixRgb(primary, white, 0.1));
        root.style.setProperty('--color-teal-600', `rgb(${primary[0]} ${primary[1]} ${primary[2]})`);
        root.style.setProperty('--color-teal-700', `rgb(${primary[0]} ${primary[1]} ${primary[2]})`);
        root.style.setProperty('--color-teal-800', mixRgb(primary, black, 0.18));
        root.style.setProperty('--color-teal-900', mixRgb(primary, black, 0.34));
        root.style.setProperty('--color-teal-950', mixRgb(primary, black, 0.52));
        root.style.setProperty('--cf-primary', primaryHex);
    }

    const accentHex = settings.accent_color || '#F6A21E';
    const accent = hexToRgb(accentHex);
    if (accent) {
        const white: [number, number, number] = [255, 255, 255];
        root.style.setProperty('--color-amber-100', mixRgb(accent, white, 0.84));
        root.style.setProperty('--color-amber-400', `rgb(${accent[0]} ${accent[1]} ${accent[2]})`);
        root.style.setProperty('--color-amber-500', `rgb(${accent[0]} ${accent[1]} ${accent[2]})`);
        root.style.setProperty('--cf-accent', accentHex);
    }

    const isDark = root.classList.contains('dark');
    const textHex = settings.text_color || '#15211F';
    const textRgb = hexToRgb(textHex);
    if (textRgb && !isDark) {
        const white: [number, number, number] = [255, 255, 255];
        root.style.setProperty('--cf-text', textHex);
        root.style.setProperty('--color-slate-900', `rgb(${textRgb[0]} ${textRgb[1]} ${textRgb[2]})`);
        root.style.setProperty('--color-slate-800', mixRgb(textRgb, white, 0.14));
        root.style.setProperty('--color-slate-700', mixRgb(textRgb, white, 0.28));
        root.style.setProperty('--color-slate-600', mixRgb(textRgb, white, 0.42));
        root.style.setProperty('--color-slate-500', mixRgb(textRgb, white, 0.56));
    } else {
        root.style.setProperty('--cf-text', isDark ? '#f1f5f9' : textHex);
        root.style.removeProperty('--color-slate-900');
        root.style.removeProperty('--color-slate-800');
        root.style.removeProperty('--color-slate-700');
        root.style.removeProperty('--color-slate-600');
        root.style.removeProperty('--color-slate-500');
    }

    const surface = settings.theme_surface || 'warm';
    const bgMap: Record<string, string> = {
        clean: '#E9F0ED',
        warm: '#FAF7F0',
        slate: '#f1f5f9',
        pure: '#ffffff',
    };
    root.style.setProperty('--cf-bg', isDark ? '#0B1120' : (bgMap[surface] || '#FAF7F0'));

    const radius = settings.border_radius || 'rounded';
    const radiusScale: Record<string, { lg: string; xl: string; '2xl': string; '3xl': string }> = {
        sharp: { lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem', '3xl': '0.625rem' },
        rounded: { lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
        pill: { lg: '0.75rem', xl: '1.125rem', '2xl': '1.5rem', '3xl': '2rem' },
    };
    const r = radiusScale[radius] || radiusScale.rounded;
    root.style.setProperty('--radius-lg', r.lg);
    root.style.setProperty('--radius-xl', r.xl);
    root.style.setProperty('--radius-2xl', r['2xl']);
    root.style.setProperty('--radius-3xl', r['3xl']);
}
