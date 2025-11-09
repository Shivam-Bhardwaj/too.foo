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
          {/* Combined Header Panel */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/65 backdrop-blur px-2 py-1.5 sm:px-4 sm:py-2 pointer-events-auto">
            {/* Main Header Row - Single line on desktop, wraps on mobile */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Title with Icon - Always first */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Solar Icon */}
                <div className="relative flex-shrink-0">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 100 100"
                    className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                    aria-label="Solar icon"
                  >
                    {/* Sun core with gradient */}
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
                    
                    {/* Central sun */}
                    <circle
                      cx="50"
                      cy="50"
                      r="20"
                      fill="url(#sunGradient)"
                      filter="url(#glow)"
                    />
                    
                    {/* Sun rays */}
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
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <p className="text-[0.45rem] sm:text-[0.5rem] uppercase tracking-[0.4em] text-emerald-300/70 leading-tight">
                    too.foo mission
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl font-light leading-tight">
                    Solar Memory Console
                  </p>
                </div>
              </div>
              
              {/* Metadata - Inline on desktop, wraps on mobile */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3 flex-1 min-w-0">
                {/* Mission Stats - Compact grid */}
                <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-xs text-white/80 flex-shrink-0">
                  {MISSION_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 px-1 py-0.5 sm:px-2 sm:py-1"
                    >
                      <p className="text-[0.35rem] sm:text-[0.4rem] uppercase tracking-[0.3em] text-white/50 leading-tight">
                        {stat.label}
                      </p>
                      <p className="font-mono text-[0.6rem] sm:text-[0.7rem] leading-tight truncate">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* UTC Time - Compact */}
                <div className="text-[0.6rem] sm:text-[0.7rem] font-mono text-emerald-200/80 ml-auto sm:ml-0 flex-shrink-0">
                  UTC · {utcTime}
                </div>
              </div>

              {/* Git Info - Compact, wraps on mobile */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[0.45rem] sm:text-[0.5rem] text-white/40 w-full sm:w-auto">
                <div className="flex items-center gap-1">
                  <span className="uppercase tracking-wider">BRANCH:</span>
                  <span className="font-mono text-white/60">{gitInfo.branch}</span>
                </div>
                <span className="text-white/20">•</span>
                <div className="flex items-center gap-1">
                  <span className="uppercase tracking-wider">COMMIT:</span>
                  <span className="font-mono text-white/60">
                    {formatCommitHash(gitInfo.commit)}
                  </span>
                </div>
                <span className="text-white/20">•</span>
                <div className="flex items-center gap-1">
                  <span className="uppercase tracking-wider">BUILT:</span>
                  <span className="font-mono text-white/60">
                    {formatBuildTime(gitInfo.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Solar Date - Compact inline row */}
            <div className="flex items-baseline gap-2 mt-1.5 sm:mt-2 border-t border-white/10 pt-1.5 sm:pt-2">
              <span className="text-[0.45rem] sm:text-[0.5rem] uppercase tracking-[0.3em] text-white/60">
                Solar Date
              </span>
              <span className="text-lg sm:text-xl md:text-2xl font-mono font-light text-white/90">
                {formatDate(currentYear)}
              </span>
            </div>
            
            {/* Controls Section - Compact */}
            <div className="border-t border-white/10 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                <div className="text-[0.45rem] sm:text-[0.5rem] uppercase tracking-[0.35em] text-white/50">
                  Visualization Controls
                </div>
                <LayerControl heroRef={heroRef} />
              </div>
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

