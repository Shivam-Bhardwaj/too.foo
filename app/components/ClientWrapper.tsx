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
      
      {/* Header Section - constrained to 10% of viewport */}
      <header
        className="fixed inset-x-0 top-0 z-30 pointer-events-none"
        style={{ height: 'calc(var(--viewport-height, 100vh) * var(--header-ratio, 0.1))' }}
      >
        <div
          className="pointer-events-auto h-full px-4 sm:px-6"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
        >
          <div className="max-w-6xl mx-auto h-full flex flex-col gap-2">
            {/* Title Section */}
            <div className="rounded-3xl border border-white/10 bg-black/65 backdrop-blur px-4 py-3">
              <div className="space-y-1">
                <p className="text-[0.55rem] uppercase tracking-[0.45em] text-emerald-300/70">
                  too.foo mission
                </p>
                <p className="text-xl sm:text-2xl font-light">Solar Memory Console</p>
              </div>
            </div>
            
            {/* Metadata Section */}
            <div className="rounded-3xl border border-white/10 bg-black/65 backdrop-blur px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid grid-cols-2 gap-2 text-xs text-white/80 sm:grid-cols-4">
                  {MISSION_STATS.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-[0.45rem] uppercase tracking-[0.35em] text-white/50">
                        {stat.label}
                      </p>
                      <p className="font-mono">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-mono text-emerald-200/80 lg:text-right">
                  UTC · {utcTime}
                </div>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex-1 min-h-0">
              <div className="h-full overflow-y-auto rounded-3xl border border-white/10 bg-black/55 backdrop-blur p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[0.55rem] uppercase tracking-[0.4em] text-white/50">
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
