'use client';

import { useRef, useState } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';
import LayerControl from './LayerControl';

export default function ClientWrapper() {
  const heroRef = useRef<HeroRef>(null);
  const [currentYear, setCurrentYear] = useState(2024.0);

  const handleTimeChange = (time: number) => {
    setCurrentYear(time);
  };

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
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Hero ref={heroRef} />
      </div>
      
      {/* Header Section - Controls and Menu */}
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <Controls
            heroRef={heroRef}
            onTimeChange={handleTimeChange}
            onDirectionChange={handleDirectionChange}
            onMotionChange={handleMotionChange}
            onPauseChange={handlePauseChange}
          />
          <LayerControl heroRef={heroRef} />
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

