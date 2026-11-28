import React, { useMemo } from 'react';

const CODE39_MAP: Record<string, string> = {
    '0': 'nnnwwnwnn',
    '1': 'wnnwnnnnw',
    '2': 'nnwwnnnnw',
    '3': 'wnwwnnnnn',
    '4': 'nnnwwnnnw',
    '5': 'wnnwwnnnn',
    '6': 'nnwwwnnnn',
    '7': 'nnnwnnwnw',
    '8': 'wnnwnnwnn',
    '9': 'nnwwnnwnn',
    A: 'wnnnnwnnw',
    B: 'nnwnnwnnw',
    C: 'wnwnnwnnn',
    D: 'nnnnwwnnw',
    E: 'wnnnwwnnn',
    F: 'nnwnwwnnn',
    G: 'nnnnnwwnw',
    H: 'wnnnnwwnn',
    I: 'nnwnnwwnn',
    J: 'nnnnwwwnn',
    K: 'wnnnnnnww',
    L: 'nnwnnnnww',
    M: 'wnwnnnnwn',
    N: 'nnnnwnnww',
    O: 'wnnnwnnwn',
    P: 'nnwnwnnwn',
    Q: 'nnnnnnwww',
    R: 'wnnnnnwwn',
    S: 'nnwnnnwwn',
    T: 'nnnnwnwwn',
    U: 'wwnnnnnnw',
    V: 'nwwnnnnnw',
    W: 'wwwnnnnnn',
    X: 'nwnnwnnnw',
    Y: 'wwnnwnnnn',
    Z: 'nwwnwnnnn',
    '-': 'nwnnnnwnw',
    '.': 'wwnnnnwnn',
    ' ': 'nwwnnnwnn',
    $: 'nwnwnwnnn',
    '/': 'nwnwnnnwn',
    '+': 'nwnnnwnwn',
    '%': 'nnnwnwnwn',
    '*': 'nwnnwnwnn',
};

export default function BarcodeSvg({
    value,
    height = 44,
    showText = true,
    className = '',
}: {
    value: string;
    height?: number;
    showText?: boolean;
    className?: string;
}) {
    const clean = (value || '')
        .toUpperCase()
        .replace(/[^0-9A-Z\-. $/+%]/g, '')
        .trim();

    const bars = useMemo(() => {
        if (!clean) return { widths: [] as Array<{ x: number; w: number }>, totalWidth: 0 };
        const encoded = `*${clean}*`;
        const narrow = 2;
        const wide = 5;
        const gap = 2;
        let x = 0;
        const rects: Array<{ x: number; w: number }> = [];

        for (let i = 0; i < encoded.length; i++) {
            const pattern = CODE39_MAP[encoded[i]] || CODE39_MAP['-'];
            for (let j = 0; j < pattern.length; j++) {
                const w = pattern[j] === 'w' ? wide : narrow;
                if (j % 2 === 0) {
                    rects.push({ x, w });
                }
                x += w;
            }
            x += gap;
        }
        return { widths: rects, totalWidth: Math.max(x, 1) };
    }, [clean]);

    if (!clean) return null;

    return (
        <div className={`inline-flex flex-col items-center ${className}`}>
            <svg
                viewBox={`0 0 ${bars.totalWidth} ${height}`}
                className="w-full max-w-[260px] h-auto"
                role="img"
                aria-label={`Barcode ${clean}`}
            >
                <rect x={0} y={0} width={bars.totalWidth} height={height} fill="#ffffff" />
                {bars.widths.map((b, idx) => (
                    <rect key={idx} x={b.x} y={0} width={b.w} height={height} fill="#0f172a" />
                ))}
            </svg>
            {showText && <span className="font-mono text-[10px] tracking-widest text-slate-700 mt-1">{clean}</span>}
        </div>
    );
}
