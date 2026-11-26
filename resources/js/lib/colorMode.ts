import { useCallback, useEffect, useState } from 'react';

export type ColorMode = 'light' | 'dark' | 'system';

export const COLOR_MODE_STORAGE_KEY = 'sf_color_mode';

export function getStoredColorMode(): ColorMode {
    if (typeof window === 'undefined') return 'light';
    try {
        const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // Ignore storage access errors (e.g. private browsing restrictions)
    }
    return 'light';
}

export function resolveIsDark(mode: ColorMode): boolean {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyColorMode(mode: ColorMode, persist = true): boolean {
    if (typeof document === 'undefined') return false;

    const isDark = resolveIsDark(mode);
    const root = document.documentElement;

    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.dataset.colorMode = mode;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        const lightPrimary = root.style.getPropertyValue('--cf-primary').trim() || '#0A5C57';
        themeMeta.setAttribute('content', isDark ? '#0B1120' : lightPrimary);
    }

    if (persist && typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
        } catch {
            // Ignore storage quota/access errors
        }
    }

    return isDark;
}

export function useColorMode() {
    const [mode, setModeState] = useState<ColorMode>(() => getStoredColorMode());
    const [isDark, setIsDark] = useState<boolean>(() => resolveIsDark(getStoredColorMode()));

    const setMode = useCallback((nextMode: ColorMode) => {
        setModeState(nextMode);
        setIsDark(applyColorMode(nextMode, true));
    }, []);

    const cycleMode = useCallback(() => {
        const order: ColorMode[] = ['light', 'dark', 'system'];
        const next = order[(order.indexOf(mode) + 1) % order.length];
        setMode(next);
    }, [mode, setMode]);

    useEffect(() => {
        setIsDark(applyColorMode(mode, false));

        if (typeof window === 'undefined') return;

        const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        const handleMedia = () => {
            if (mode === 'system') {
                setIsDark(applyColorMode('system', false));
            }
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === COLOR_MODE_STORAGE_KEY) {
                const synced = getStoredColorMode();
                setModeState(synced);
                setIsDark(applyColorMode(synced, false));
            }
        };

        media?.addEventListener('change', handleMedia);
        window.addEventListener('storage', handleStorage);

        return () => {
            media?.removeEventListener('change', handleMedia);
            window.removeEventListener('storage', handleStorage);
        };
    }, [mode]);

    return { mode, isDark, setMode, cycleMode };
}
