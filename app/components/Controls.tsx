'use client';

import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion, createMotionObserver, smoothSeek } from '../lib/motion';
import { HeroRef } from './Hero';

type Direction = 1 | -1;

interface ControlsProps {
  heroRef: React.RefObject<HeroRef>;
  onTimeChange: (time: number) => void;
  onDirectionChange: (direction: Direction) => void;
  onMotionChange: (enabled: boolean) => void;
  onPauseChange: (paused: boolean) => void;
}

export default function Controls({
  heroRef,
  onTimeChange,
  onDirectionChange,
  onMotionChange,
  onPauseChange,
}: ControlsProps) {
  const [time, setTime] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const sliderRef = useRef<HTMLInputElement>(null);
  const lastTimeRef = useRef(0);
  const targetTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const systemReduced = getPrefersReducedMotion();
    setReduceMotion(systemReduced);
    onMotionChange(!systemReduced);

    const cleanup = createMotionObserver((reduced) => {
      setReduceMotion(reduced);
      onMotionChange(!reduced);
      if (reduced) {
        setAnnouncement('Motion off (respects your system setting).');
      }
    });

    return cleanup;
  }, [onMotionChange]);

  useEffect(() => {
    if (reduceMotion || paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastFrameTime = performance.now();

    function animate(currentTime: number) {
      const dt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;

      // Smooth seek to target if user scrubbed
      const current = lastTimeRef.current;
      const target = targetTimeRef.current;
      let finalTime: number;
      if (Math.abs(current - target) > 0.001) {
        finalTime = smoothSeek(current, target, dt);
        lastTimeRef.current = finalTime;
        setTime(finalTime);
        onTimeChange(finalTime);
      } else {
        // Auto-drift (forward or reverse based on direction)
        finalTime = ((current + (dt / 75) * direction + 1) % 1);
        if (finalTime < 0) finalTime += 1;
        lastTimeRef.current = finalTime;
        targetTimeRef.current = finalTime;
        setTime(finalTime);
        onTimeChange(finalTime);
      }
      
      // Update scene
      if (heroRef.current) {
        heroRef.current.updateScene(finalTime, direction, !reduceMotion && !paused);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reduceMotion, paused, direction, onTimeChange]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    targetTimeRef.current = value;
    setTime(value);
    onTimeChange(value);
  };

  const handleDirectionToggle = () => {
    const newDirection = direction === 1 ? -1 : 1;
    setDirection(newDirection);
    onDirectionChange(newDirection);
    setAnnouncement(`Direction: ${newDirection === 1 ? 'Apex' : 'Reverse'}`);
  };

  const handlePauseToggle = () => {
    const newPaused = !paused;
    setPaused(newPaused);
    onPauseChange(newPaused);
    setAnnouncement(newPaused ? 'Background paused.' : 'Background resumed.');
  };

  const handleReduceMotionToggle = () => {
    if (!getPrefersReducedMotion()) {
      const newReduced = !reduceMotion;
      setReduceMotion(newReduced);
      onMotionChange(!newReduced);
      if (newReduced) {
        setAnnouncement('Motion off (respects your system setting).');
      }
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      sliderRef.current?.blur();
    }
  };

  const motionDisabled = reduceMotion || paused;

  return (
    <div className="fixed bottom-4 right-4 z-10 flex flex-col gap-3 bg-cosmic-indigo/90 backdrop-blur-sm border border-cosmic-cyan/20 rounded-lg p-4 shadow-lg">
      <div className="flex flex-col gap-2 min-w-[200px]">
        {/* Time Slider */}
        <div className="flex flex-col gap-1">
          <label htmlFor="time-slider" className="text-xs text-cosmic-cyan/80">
            Time
          </label>
          <input
            id="time-slider"
            ref={sliderRef}
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={time}
            onChange={handleTimeChange}
            onKeyDown={handleSliderKeyDown}
            disabled={motionDisabled}
            aria-label="Time"
            title="Scrub the solar drift."
            className="w-full h-2 bg-cosmic-cyan/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cosmic-cyan/50"
            style={{
              background: `linear-gradient(to right, #99E6FF 0%, #99E6FF ${time * 100}%, rgba(153, 230, 255, 0.2) ${time * 100}%, rgba(153, 230, 255, 0.2) 100%)`,
            }}
          />
        </div>

        {/* Direction Toggle */}
        <button
          onClick={handleDirectionToggle}
          disabled={motionDisabled}
          aria-label="Switch travel direction"
          title="Switch travel direction"
          className="px-3 py-1.5 text-sm text-cosmic-cyan bg-cosmic-cyan/10 border border-cosmic-cyan/30 rounded hover:bg-cosmic-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cosmic-cyan/50 transition-colors"
        >
          {direction === 1 ? 'Apex →' : 'Reverse ←'}
        </button>

        {/* Reduce Motion Toggle */}
        <button
          onClick={handleReduceMotionToggle}
          disabled={getPrefersReducedMotion()}
          aria-label="Disable background motion"
          title={reduceMotion ? 'Motion off' : 'Disable background motion'}
          className="px-3 py-1.5 text-sm text-cosmic-cyan bg-cosmic-cyan/10 border border-cosmic-cyan/30 rounded hover:bg-cosmic-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cosmic-cyan/50 transition-colors"
        >
          Reduce motion
        </button>

        {/* Pause Button */}
        <button
          onClick={handlePauseToggle}
          disabled={reduceMotion}
          aria-label="Pause background"
          title="Pause background"
          className="px-3 py-1.5 text-sm text-cosmic-cyan bg-cosmic-cyan/10 border border-cosmic-cyan/30 rounded hover:bg-cosmic-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cosmic-cyan/50 transition-colors"
        >
          Pause background
        </button>
      </div>

      {/* Aria-live announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Visual reduced motion note */}
      {reduceMotion && (
        <p className="text-xs text-cosmic-cyan/60 mt-1">
          Motion off (respects your system setting).
        </p>
      )}
    </div>
  );
}

