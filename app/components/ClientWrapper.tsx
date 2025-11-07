'use client';

import { useRef, useState, useCallback, useMemo, type CSSProperties } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';
import LayerControl from './LayerControl';
import { useViewportSize, useSafeAreaInsets } from '../lib/hooks/useViewport';
import { getHeroViewportMetrics, getControlDockLayout } from '../lib/responsiveLayout';

export default function ClientWrapper() {
  const heroRef = useRef<HeroRef>(null);
  const [currentYear, setCurrentYear] = useState(2024.0);
  const viewport = useViewportSize();
  const safeArea = useSafeAreaInsets();
  const heroMetrics = useMemo(
    () => getHeroViewportMetrics(viewport, safeArea),
    [viewport, safeArea]
  );
  const controlLayout = getControlDockLayout(viewport);
  const layerDensity = controlLayout === 'inline' ? 'floating' : 'panel';
  const heroFrameStyle: CSSProperties = {
    paddingTop: `calc(${safeArea.top}px + 1rem)`,
    paddingBottom: `calc(${safeArea.bottom}px + 2rem)`,
  };
  const heroViewportStyle: CSSProperties = {
    height: `${heroMetrics.height}px`,
    maxHeight: 'min(100vh, 100svh)',
  };
  const controlsWrapperClass = [
    'pointer-events-auto gap-3 transition-all duration-300',
    controlLayout === 'inline' && 'flex items-center justify-center',
    controlLayout === 'compact' && 'flex flex-wrap items-center justify-center w-full',
    controlLayout === 'stacked' && 'flex flex-col w-full',
  ]
    .filter(Boolean)
    .join(' ');

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
      {/* Canvas - Responsive viewport */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4" style={heroFrameStyle}>
          <div
            className="relative w-full overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.65)]"
            style={heroViewportStyle}
          >
            <Hero ref={heroRef} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />
          </div>
        </div>
      </div>
      
      {/* Header Section - Controls and Menu */}
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="mx-auto w-full max-w-5xl px-4" style={{ paddingTop: `calc(${safeArea.top}px + 0.5rem)` }}>
          <div className={controlsWrapperClass}>
            <LayerControl heroRef={heroRef} density={layerDensity} />
            <Controls
              heroRef={heroRef}
              onTimeChange={handleTimeChange}
              onDirectionChange={handleDirectionChange}
              onMotionChange={handleMotionChange}
              onPauseChange={handlePauseChange}
              layout={controlLayout}
            />
          </div>
        </div>
      </header>

      {/* Bottom status card */}
      <div className="fixed bottom-6 left-0 right-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-md px-4" style={{ paddingBottom: `calc(${safeArea.bottom}px + 0.5rem)` }}>
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-white shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Current Epoch</p>
            <p className="text-2xl font-mono text-white/90">{formatDate(currentYear)}</p>
            <p className="text-xs text-white/50">Solar Memory • Interstellar Weather Station</p>
          </div>
        </div>
      </div>
    </>
  );
}
