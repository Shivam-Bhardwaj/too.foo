'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const gitInfo = useMemo(
    () => ({
      commit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'local',
      branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'main',
      timestamp: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    }),
    [],
  );

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
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
      role="banner"
    >
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 text-white">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 100 100"
                    className="h-7 w-7 sm:h-6 sm:w-6"
                    aria-hidden="true"
                    role="img"
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
                    <circle cx="50" cy="50" r="20" fill="url(#sunGradient)" filter="url(#glow)" />
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
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                    <p className="text-[0.55rem] uppercase tracking-[0.35em] text-emerald-300/60">
                      too.foo mission
                    </p>
                    <h2 className="text-base font-light sm:text-sm">Solar Memory Console</h2>
                  </div>
                </div>

                <div className="hidden flex-1 flex-wrap items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.3em] text-white/50 sm:flex sm:justify-end">
                  {MISSION_STATS.map((stat) => (
                    <span key={stat.label} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
                      <span>{stat.label}</span>
                      <span className="font-mono text-white/80">{stat.value}</span>
                    </span>
                  ))}
                </div>

                <div className="sm:ml-auto hidden flex-col gap-0.5 text-right font-mono text-[0.6rem] text-emerald-200/80 sm:flex">
                  <span>UTC · {utcTime || '—'}</span>
                  <span className="text-white/60">Solar Date · {formatDate(currentYear)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
                {MISSION_STATS.map((stat) => (
                  <span key={stat.label} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.55rem] text-white/70">
                    <span className="uppercase tracking-[0.25em] text-white/50">{stat.label}</span>
                    <span className="font-mono text-white/80">{stat.value}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-1 text-[0.6rem] font-mono text-emerald-200/80 sm:hidden">
                <span>UTC · {utcTime || '—'}</span>
                <span className="text-white/60">Solar Date · {formatDate(currentYear)}</span>
              </div>

              <Controls
                heroRef={heroRef}
                onTimeChange={onTimeChange}
                onDirectionChange={onDirectionChange}
                onMotionChange={onMotionChange}
                onPauseChange={onPauseChange}
              />

              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 sm:items-center sm:gap-3 sm:pt-3">
                <LayerControl heroRef={heroRef} />
                <div className="flex flex-wrap items-center gap-1 text-[0.5rem] uppercase tracking-[0.25em] text-white/40 sm:ml-auto">
                  <span>Branch</span>
                  <span className="font-mono text-white/60">{gitInfo.branch}</span>
                  <span className="text-white/20">•</span>
                  <span>Commit</span>
                  <span className="font-mono text-white/60">{formatCommitHash(gitInfo.commit)}</span>
                  <span className="text-white/20">•</span>
                  <span>Built</span>
                  <span className="font-mono text-white/60">{formatBuildTime(gitInfo.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

