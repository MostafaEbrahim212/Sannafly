import { useEffect, useRef } from 'react';

export interface RealtimeNotificationItem {
    id: string;
    data: {
        category: 'order' | 'payment' | 'inventory' | 'inquiry' | string;
        title_en: string;
        title_ar: string;
        body_en: string;
        body_ar: string;
        url: string;
        meta?: Record<string, unknown>;
    };
    read_at: string | null;
    created_at: string;
    human_time: string;
}

/**
 * Polls a real-time JSON feed while the browser tab is visible.
 * Automatically pauses when the tab is hidden and triggers immediately on focus.
 */
export function useRealtimeFeed<T>(
    url: string | null,
    enabled: boolean,
    onData: (data: T) => void,
    intervalMs = 6000
): void {
    const callbackRef = useRef(onData);
    callbackRef.current = onData;

    useEffect(() => {
        if (!enabled || !url || typeof window === 'undefined') return;

        let active = true;
        let timer: number | undefined;

        const fetchFeed = async () => {
            if (!active || document.visibilityState === 'hidden') return;
            try {
                const res = await fetch(url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok || !active) return;
                const data = (await res.json()) as T;
                if (active) {
                    callbackRef.current(data);
                }
            } catch {
                // Silent retry on next interval
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchFeed();
            }
        };

        void fetchFeed();
        timer = window.setInterval(fetchFeed, intervalMs);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            active = false;
            if (timer !== undefined) window.clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [url, enabled, intervalMs]);
}
