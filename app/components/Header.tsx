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
  const [showDetails, setShowDetails] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <div className="px-2 sm:px-2 lg:px-3">
        <div className="w-full">
          {/* Mobile: Collapsed Header (Minimal) */}
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="sm:hidden rounded-lg border border-white/10 bg-black/65 backdrop-blur px-2 py-1.5 pointer-events-auto min-h-[44px] text-white/80 hover:text-white transition-colors"
              aria-label="Expand header"
            >
              <div className="flex items-center gap-1.5">
                <svg width="20" height="20" viewBox="0 0 100 100" className="w-4 h-4">
                  <circle cx="50" cy="50" r="20" fill="#FDB813" opacity="0.8" />
                </svg>
                <span className="text-[0.65rem] font-mono">{formatDate(currentYear)}</span>
                <span className="text-[0.5rem] text-emerald-200/80">▼</span>
              </div>
            </button>
          ) : (
            /* Mobile-First Header Panel */
            <div className="rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/10 bg-black/65 backdrop-blur px-2 py-2 sm:px-3 sm:py-1.5 pointer-events-auto">
              {/* Mobile: Vertical Stack | Desktop: Horizontal Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1 lg:gap-1.5">
                {/* Title Section - Always visible */}
                <div className="flex items-center gap-1.5 sm:gap-1 flex-shrink-0">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 100 100"
                    className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5"
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
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1">
                    <p className="text-[0.5rem] sm:text-[0.4rem] uppercase tracking-[0.3em] text-emerald-300/70 leading-tight">
                      too.foo mission
                    </p>
                    <p className="text-sm sm:text-xs lg:text-sm font-light leading-tight">
                      Solar Memory Console
                    </p>
                  </div>
                </div>
                
                {/* Mobile: Collapsible Details | Desktop: Always Visible */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1 lg:gap-1.5 flex-1 min-w-0">
                  {/* Mission Stats */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-0.5 lg:gap-1 flex-shrink-0">
                    {MISSION_STATS.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-1 sm:px-1 sm:py-0.5"
                      >
                        <span className="text-[0.5rem] sm:text-[0.3rem] lg:text-[0.35rem] uppercase tracking-wider text-white/50">
                          {stat.label}:
                        </span>
                        <span className="font-mono text-[0.65rem] sm:text-[0.5rem] lg:text-[0.55rem] text-white/80 leading-tight">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* UTC Time & Solar Date - Mobile: Stacked | Desktop: Inline */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1 lg:gap-1.5 flex-shrink-0">
                    <div className="text-[0.65rem] sm:text-[0.4rem] lg:text-[0.5rem] font-mono text-emerald-200/80">
                      UTC · {utcTime}
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-[0.5rem] sm:text-[0.35rem] lg:text-[0.4rem] uppercase tracking-wider text-white/60">
                        Solar Date:
                      </span>
                      <span className="text-sm sm:text-xs lg:text-sm font-mono font-light text-white/90">
                        {formatDate(currentYear)}
                      </span>
                    </div>
                  </div>

                  {/* Git Info - Mobile: Collapsible | Desktop: Always Visible */}
                  <div className={`${showDetails ? 'flex' : 'hidden'} sm:flex items-center gap-1 text-[0.5rem] sm:text-[0.35rem] lg:text-[0.4rem] text-white/40 sm:ml-auto flex-shrink-0 flex-wrap`}>
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

                {/* Mobile: Toggle Details Button */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="sm:hidden px-2 py-1.5 text-[0.65rem] text-white/60 hover:text-white/80 border border-white/10 rounded transition-colors flex-shrink-0"
                  aria-label={showDetails ? 'Hide details' : 'Show details'}
                >
                  {showDetails ? '−' : '+'}
                </button>
              </div>

              {/* Controls Section - Mobile: Stacked | Desktop: Inline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1 mt-2 sm:mt-0.5 pt-2 sm:pt-0.5 border-t border-white/10">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <LayerControl heroRef={heroRef} />
                  {/* Mobile: Collapse Button */}
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="sm:hidden px-2 py-1.5 text-[0.65rem] text-white/60 hover:text-white/80 border border-white/10 rounded transition-colors flex-shrink-0"
                    aria-label="Minimize header"
                  >
                    ▲
                  </button>
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
          )}
        </div>
      </div>
    </header>
  );
}

