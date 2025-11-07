'use client';

import { useRef } from 'react';
import Hero, { HeroRef } from './Hero';
import Controls from './Controls';

export default function ClientWrapper() {
  const heroRef = useRef<HeroRef>(null);

  const handleTimeChange = (time: number) => {
    // Time updates are handled internally by Controls animation loop
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

  return (
    <>
      <div className="absolute inset-0 z-0">
        <Hero ref={heroRef} />
      </div>
      <Controls
        heroRef={heroRef}
        onTimeChange={handleTimeChange}
        onDirectionChange={handleDirectionChange}
        onMotionChange={handleMotionChange}
        onPauseChange={handlePauseChange}
      />
    </>
  );
}

