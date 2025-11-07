'use client';

import { useRef, useState, useCallback, useEffect, type CSSProperties } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';
import LayerControl from './LayerControl';

export default function ClientWrapper() {
  const heroRef = useRef<HeroRef>(null);
  const [currentYear, setCurrentYear] = useState(2024.0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
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

  const isMobileViewport = viewport.width > 0 ? viewport.width <= 768 : false;
  const heroWrapperClassName = isMobileViewport
    ? 'fixed inset-0 z-0 pointer-events-none flex items-center justify-center px-2'
    : 'fixed inset-0 z-0 pointer-events-none';
  const heroWrapperStyle: CSSProperties | undefined = isMobileViewport
    ? {
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }
    : undefined;
  const heroViewportStyle: CSSProperties | undefined =
    isMobileViewport && viewport.height > 0
      ? {
          width: '100%',
          maxWidth: `${viewport.width}px`,
          height: `${Math.min(viewport.height, viewport.width * (16 / 9))}px`,
          maxHeight: `${viewport.height}px`,
        }
      : undefined;

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
      <div className={heroWrapperClassName} style={heroWrapperStyle}>
        <div className="relative w-full h-full pointer-events-none" style={heroViewportStyle}>
          <Hero ref={heroRef} />
        </div>
      </div>
      
      {/* Header Section - Controls and Menu (one line) */}
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-center gap-3 pt-4">
          <LayerControl heroRef={heroRef} />
          <Controls
            heroRef={heroRef}
            onTimeChange={handleTimeChange}
            onDirectionChange={handleDirectionChange}
            onMotionChange={handleMotionChange}
            onPauseChange={handlePauseChange}
          />
        </div>
      </header>

      {/* Middle Section - Date Display (centered) */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="text-center">
          <div className="text-5xl md:text-6xl font-mono font-light text-white/90 drop-shadow-lg">
            {formatDate(currentYear)}
          </div>
        </div>
      </div>
    </>
  );
}
