'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';
import LayerControl from './LayerControl';

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
      
      {/* Header Section - Controls and Menu */}
      <header className="fixed inset-x-0 top-0 z-30 pointer-events-none">
        <div
          className="pointer-events-auto px-4 sm:px-6"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-3xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50">too.foo mission</p>
                <p className="text-lg text-white">Solar Memory Navigation Console</p>
              </div>
              <div className="text-sm font-mono text-emerald-300/80">
                UTC · {utcTime}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                  Layers
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
      </header>

      {/* Date Display - responsive placement */}
      <div className="fixed inset-x-4 top-28 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-20 pointer-events-none">
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
