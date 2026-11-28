import React, { useEffect, useRef, useState } from 'react';
import {
    CheckCircle2,
    Maximize2,
    Minimize2,
    Pause,
    PictureInPicture2,
    Play,
    RotateCcw,
    RotateCw,
    Volume2,
    VolumeX,
} from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    isAr?: boolean;
    onEnded?: () => void;
}

const SPEEDS = [1, 1.25, 1.5, 2];

function formatTime(sec: number): string {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
}

export default function VideoPlayer({ src, poster, title, isAr = false, onEnded }: VideoPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [streamError, setStreamError] = useState(false);

    useEffect(() => {
        setPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setCompleted(false);
        setBuffering(false);
        setStreamError(false);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    }, [src]);

    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play().catch(() => {});
        } else {
            v.pause();
        }
    };

    const seekBy = (delta: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current;
        if (!v) return;
        const val = Number(e.target.value);
        v.currentTime = val;
        setCurrentTime(val);
    };

    const cycleSpeed = () => {
        const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
        setSpeed(next);
        if (videoRef.current) {
            videoRef.current.playbackRate = next;
        }
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !muted;
        setMuted(!muted);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current;
        const val = Number(e.target.value);
        setVolume(val);
        if (v) {
            v.volume = val;
            v.muted = val === 0;
        }
        setMuted(val === 0);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // Ignore browser restrictions
        }
    };

    const togglePiP = async () => {
        const v = videoRef.current as any;
        if (!v || !document.pictureInPictureEnabled) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await v.requestPictureInPicture();
            }
        } catch {
            // Ignore PiP errors
        }
    };

    const resolvedSrc = src.startsWith('/docs/videos/')
        ? `/admin/help/videos/stream/${src.split('/').pop()}`
        : src;

    const retryFromCurrentTime = () => {
        const v = videoRef.current;
        if (!v) return;
        const resumeAt = v.currentTime || currentTime || 0;
        setStreamError(false);
        setBuffering(true);
        v.load();
        const onReady = () => {
            v.currentTime = resumeAt;
            v.playbackRate = speed;
            v.play().catch(() => {});
            setBuffering(false);
            v.removeEventListener('loadedmetadata', onReady);
        };
        v.addEventListener('loadedmetadata', onReady);
    };

    const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div
            ref={containerRef}
            dir="ltr"
            className={`group relative overflow-hidden bg-slate-950 select-none ${
                isFullscreen
                    ? 'w-screen h-screen flex flex-col justify-between bg-black'
                    : 'rounded-2xl border border-slate-800 shadow-xl'
            }`}
        >
            <div className={isFullscreen ? 'relative flex-1 min-h-0 flex items-center justify-center bg-black' : 'relative'}>
                <video
                    ref={videoRef}
                    key={resolvedSrc}
                    poster={poster}
                    preload="metadata"
                    onClick={togglePlay}
                    onPlay={() => {
                        setPlaying(true);
                        setStreamError(false);
                    }}
                    onPause={() => setPlaying(false)}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => {
                        setBuffering(false);
                        setStreamError(false);
                    }}
                    onCanPlay={() => setBuffering(false)}
                    onStalled={() => setBuffering(true)}
                    onError={() => {
                        setBuffering(false);
                        setPlaying(false);
                        setStreamError(true);
                    }}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
                    onEnded={() => {
                        setPlaying(false);
                        setBuffering(false);
                        setCompleted(true);
                        onEnded?.();
                    }}
                    className={`w-full object-contain bg-black cursor-pointer ${
                        isFullscreen ? 'h-full max-h-none' : 'max-h-[480px] aspect-video'
                    }`}
                >
                    <source src={resolvedSrc} type={resolvedSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                </video>

                {buffering && !streamError && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/30">
                        <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 text-white text-xs font-semibold animate-pulse">
                            {isAr ? 'جاري التحميل...' : 'Buffering...'}
                        </div>
                    </div>
                )}

                {streamError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-white p-4">
                        <p className="text-xs sm:text-sm font-semibold">
                            {isAr ? 'توقف البث مؤقتًا' : 'Playback interrupted'}
                        </p>
                        <button
                            type="button"
                            onClick={retryFromCurrentTime}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>{isAr ? 'استكمال من نفس النقطة' : 'Resume Playback'}</span>
                        </button>
                    </div>
                )}

                {/* Center Play Overlay when paused */}
                {!playing && !streamError && (
                    <button
                        type="button"
                        onClick={togglePlay}
                        aria-label={isAr ? 'تشغيل الفيديو' : 'Play video'}
                        className="absolute inset-0 flex items-center justify-center bg-slate-950/35 transition-opacity hover:bg-slate-950/45"
                    >
                        <span className="w-16 h-16 rounded-full bg-teal-600/95 hover:bg-teal-500 text-white flex items-center justify-center shadow-2xl ring-4 ring-white/20 transition-transform hover:scale-105">
                            <Play className="w-7 h-7 ms-0.5 fill-current" />
                        </span>
                    </button>
                )}

                {/* Top Title Badge */}
                {title && (
                    <div className="pointer-events-none absolute top-3 start-3 end-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 rounded-lg bg-slate-950/75 backdrop-blur text-white text-xs font-semibold truncate">
                            {title}
                        </span>
                        {completed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isAr ? 'مكتمل' : 'Completed'}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Controls Bar */}
            <div className="bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-4 pt-6 pb-3 space-y-2">
                {/* Seekbar */}
                <div className="relative flex items-center">
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.5}
                        value={currentTime}
                        onChange={handleSeek}
                        aria-label="Seek"
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-teal-500"
                        style={{
                            background: `linear-gradient(to right, #14b8a6 ${progressPct}%, #334155 ${progressPct}%)`,
                        }}
                    />
                </div>

                {/* Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-white">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title={playing ? 'Pause' : 'Play'}
                        >
                            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => seekBy(-10)}
                            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-white/10 text-[11px] font-semibold"
                            title="-10s"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>10</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => seekBy(10)}
                            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-white/10 text-[11px] font-semibold"
                            title="+10s"
                        >
                            <span>10</span>
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Volume */}
                        <div className="hidden sm:flex items-center gap-1.5 ms-1">
                            <button type="button" onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/10">
                                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={muted ? 0 : volume}
                                onChange={handleVolume}
                                aria-label="Volume"
                                className="w-16 h-1 rounded-full appearance-none cursor-pointer bg-slate-700 accent-teal-400"
                            />
                        </div>

                        <span className="text-xs font-mono text-slate-300 ms-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={cycleSpeed}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold font-mono"
                            title="Playback Speed"
                        >
                            {speed}x
                        </button>

                        <button
                            type="button"
                            onClick={togglePiP}
                            className="hidden sm:inline-flex p-2 rounded-lg hover:bg-white/10"
                            title="Picture in Picture"
                        >
                            <PictureInPicture2 className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg hover:bg-white/10"
                            title="Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
