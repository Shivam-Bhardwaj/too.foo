'use client';

import { useEffect, useState } from 'react';
import Controls from './Controls';
import LayerControl from './LayerControl';
import { HeroRef } from './Hero';

const MISSION_STATS = [
  { label: 'Phase', value: 'Prelaunch' },
  { label: 'Window', value: '1977 → 2077' },
  { label: 'Signal', value: 'Voyager + IBEX' },
  { label: 'Medium', value: 'Heliopause' },
];

interface HeaderProps {
  heroRef: React.RefObject<HeroRef>;
  currentYear: number;
  onTimeChange: (time: number) => void;
  onDirectionChange: (direction: 1 | -1) => void;
  onMotionChange: (enabled: boolean) => void;
  onPauseChange: (paused: boolean) => void;
}

export default function Header({
  heroRef,
  currentYear,
  onTimeChange,
  onDirectionChange,
  onMotionChange,
  onPauseChange,
}: HeaderProps) {
  const [utcTime, setUtcTime] = useState('');
  const [gitInfo, setGitInfo] = useState({
    commit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'local',
    branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'main',
    timestamp: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateUtc = () => setUtcTime(new Date().toUTCString());
    updateUtc();
    const id = window.setInterval(updateUtc, 1000);
    return () => window.clearInterval(id);
  }, []);

  const formatDate = (year: number): string => {
    if (year >= 1000 && year < 10000) {
      const wholeYear = Math.floor(year);
      const fraction = year - wholeYear;
      const days = Math.floor(fraction * 365.25);
      const date = new Date(wholeYear, 0, 1);
      date.setDate(date.getDate() + days);
      
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return year.toFixed(0);
  };

  const formatCommitHash = (hash: string) => {
    return hash.length > 7 ? hash.substring(0, 7) : hash;
  };

  const formatBuildTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.25rem)' }}
    >
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Combined Header Panel - 2 lines only */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/65 backdrop-blur px-2 py-1 sm:px-3 sm:py-1.5 pointer-events-auto">
            {/* Line 1: Title + Mission Stats + UTC + Solar Date + Git Info */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 lg:gap-2">
              {/* Title with Icon */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 100 100"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  aria-label="Solar icon"
                >
                  <defs>
                    <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FDB813" stopOpacity="1" />
                      <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity="0.7" />
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="url(#sunGradient)"
                    filter="url(#glow)"
                  />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 50 + Math.cos(rad) * 25;
                    const y1 = 50 + Math.sin(rad) * 25;
                    const x2 = 50 + Math.cos(rad) * 35;
                    const y2 = 50 + Math.sin(rad) * 35;
                    return (
                      <line
                        key={angle}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#FDB813"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    );
                  })}
                </svg>
                <div className="flex items-baseline gap-1">
                  <p className="text-[0.35rem] sm:text-[0.4rem] uppercase tracking-[0.3em] text-emerald-300/70 leading-tight">
                    too.foo mission
                  </p>
                  <p className="text-xs sm:text-sm font-light leading-tight">
                    Solar Memory Console
                  </p>
                </div>
              </div>
              
              {/* Mission Stats - Inline compact */}
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {MISSION_STATS.map((stat, idx) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1 py-0.5"
                  >
                    <span className="text-[0.3rem] uppercase tracking-wider text-white/50">
                      {stat.label}:
                    </span>
                    <span className="font-mono text-[0.5rem] sm:text-[0.55rem] text-white/80 leading-tight">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* UTC Time */}
              <div className="text-[0.4rem] sm:text-[0.5rem] font-mono text-emerald-200/80 flex-shrink-0">
                UTC · {utcTime}
              </div>
              
              {/* Solar Date */}
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-[0.35rem] uppercase tracking-wider text-white/60">
                  Solar Date:
                </span>
                <span className="text-xs sm:text-sm font-mono font-light text-white/90">
                  {formatDate(currentYear)}
                </span>
              </div>

              {/* Git Info - Compact */}
              <div className="flex items-center gap-1 text-[0.35rem] sm:text-[0.4rem] text-white/40 ml-auto flex-shrink-0">
                <span className="uppercase tracking-wider">BRANCH:</span>
                <span className="font-mono text-white/60">{gitInfo.branch}</span>
                <span className="text-white/20">•</span>
                <span className="uppercase tracking-wider">COMMIT:</span>
                <span className="font-mono text-white/60">{formatCommitHash(gitInfo.commit)}</span>
                <span className="text-white/20">•</span>
                <span className="uppercase tracking-wider">BUILT:</span>
                <span className="font-mono text-white/60">{formatBuildTime(gitInfo.timestamp)}</span>
              </div>
            </div>

            {/* Line 2: Layers + Controls */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1 pt-1 border-t border-white/10">
              <LayerControl heroRef={heroRef} />
              <Controls
                heroRef={heroRef}
                onTimeChange={onTimeChange}
                onDirectionChange={onDirectionChange}
                onMotionChange={onMotionChange}
                onPauseChange={onPauseChange}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

