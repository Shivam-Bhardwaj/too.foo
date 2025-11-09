'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';
import LayerControl from './LayerControl';

const MISSION_STATS = [
  { label: 'Phase', value: 'Prelaunch' },
  { label: 'Window', value: '1977 → 2077' },
  { label: 'Signal', value: 'Voyager + IBEX' },
  { label: 'Medium', value: 'Heliopause' },
];

export default function ClientWrapper() {
  const heroRef = useRef<HeroRef>(null);
  const [currentYear, setCurrentYear] = useState(2024.0);
  const [utcTime, setUtcTime] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    };
    updateViewportHeight();
    const handleOrientation = () => updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', handleOrientation);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateViewportHeight);
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', handleOrientation);
      vv?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateUtc = () => setUtcTime(new Date().toUTCString());
    updateUtc();
    const id = window.setInterval(updateUtc, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentYear(time);
  }, []);

  const handleDirectionChange = (direction: 1 | -1) => {
    // Direction updates are handled internally by Controls
  };

  const handleMotionChange = (enabled: boolean) => {
    // Motion updates are handled internally by Controls
  };

  const handlePauseChange = (paused: boolean) => {
    // Pause updates are handled internally by Controls
  };

  // Format date as YYYY-MM-DD
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

  return (
    <>
      {/* Canvas - Full screen background */}
      <div
        className="fixed left-0 right-0 top-0 z-0 pointer-events-none"
        style={{ height: 'var(--viewport-height, 100vh)' }}
      >
        <Hero ref={heroRef} />
      </div>
      
      {/* Header Section */}
      <header
        className="fixed inset-x-0 top-0 z-30 pointer-events-none"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.25rem)' }}
      >
        <div className="px-2 sm:px-4 lg:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Combined Header Panel */}
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/65 backdrop-blur px-2 py-2 sm:px-4 sm:py-3 pointer-events-auto">
              {/* Title and Metadata Row */}
              <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Title */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[0.5rem] sm:text-[0.55rem] uppercase tracking-[0.45em] text-emerald-300/70">
                      too.foo mission
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-light leading-tight">Solar Memory Console</p>
                  </div>
                  
                  {/* Metadata - Compact on mobile */}
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 lg:gap-3">
                    <div className="grid grid-cols-4 gap-1 sm:gap-2 text-xs text-white/80">
                      {MISSION_STATS.map((stat) => (
                        <div key={stat.label} className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-1.5 py-1 sm:px-3 sm:py-2">
                          <p className="text-[0.4rem] sm:text-[0.45rem] uppercase tracking-[0.35em] text-white/50 leading-tight">
                            {stat.label}
                          </p>
                          <p className="font-mono text-[0.65rem] sm:text-xs leading-tight">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="text-[0.65rem] sm:text-xs font-mono text-emerald-200/80 sm:text-right">
                      UTC · {utcTime}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Controls Section - Integrated */}
              <div className="border-t border-white/10 pt-2 sm:pt-3 space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[0.5rem] sm:text-[0.55rem] uppercase tracking-[0.4em] text-white/50">
                    Visualization Controls
                  </div>
                  <LayerControl heroRef={heroRef} />
                </div>
                <Controls
                  heroRef={heroRef}
                  onTimeChange={handleTimeChange}
                  onDirectionChange={handleDirectionChange}
                  onMotionChange={handleMotionChange}
                  onPauseChange={handlePauseChange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Footer Section */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <div className="px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur px-4 py-2">
              <p className="text-[0.5rem] sm:text-[0.55rem] text-white/50 text-center">
                Voyager telemetry · IBEX maps · Magnetohydrodynamic inference
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Date Display - responsive placement */}
      <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] sm:inset-auto sm:left-1/2 sm:bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)] sm:w-auto sm:-translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 sm:bg-transparent sm:border-none sm:backdrop-blur-0 sm:px-0 sm:py-0 sm:text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/60 mb-1 sm:mb-2 text-left sm:text-center">
            Solar Date
          </p>
          <div className="text-3xl sm:text-5xl md:text-6xl font-mono font-light text-white/90 drop-shadow-lg text-left sm:text-center">
            {formatDate(currentYear)}
          </div>
        </div>
      </div>
    </>
  );
}
