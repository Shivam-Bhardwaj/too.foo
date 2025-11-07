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
  const [time, setTime] = useState(0.5);
  const [direction, setDirection] = useState<Direction>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const sliderRef = useRef<HTMLInputElement>(null);
  const lastTimeRef = useRef(0.5);
  const targetTimeRef = useRef(0.5);
  const animationFrameRef = useRef<number | null>(null);
  
  // Speed up time - ~1 full Earth orbit every 20s
  const AUTOPLAY_SPEED = 1 / 20; // normalized cycles per second

  useEffect(() => {
    setAnnouncement('Direction: Apex. Time set to 0.5. Fast mode enabled.');
    onTimeChange(0.5);
  }, [onTimeChange]);

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
      heroRef.current?.updateScene(lastTimeRef.current, direction, !reduced && !paused);
    });

    return cleanup;
  }, [onMotionChange, heroRef, direction, paused]);

  useEffect(() => {
    if (reduceMotion || paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      heroRef.current?.updateScene(lastTimeRef.current, direction, false);
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
        // Fast auto-drift with AUTOPLAY_SPEED
        finalTime = ((current + (dt * AUTOPLAY_SPEED) * direction + 1) % 1);
        if (finalTime < 0) finalTime += 1;
        lastTimeRef.current = finalTime;
        targetTimeRef.current = finalTime;
        setTime(finalTime);
        onTimeChange(finalTime);
      }
      
      // Update scene
      heroRef.current?.updateScene(finalTime, direction, true);

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
    lastTimeRef.current = value;
    setTime(value);
    onTimeChange(value);
    heroRef.current?.updateScene(value, direction, !reduceMotion && !paused);
  };

  const handleDirectionToggle = () => {
    const newDirection = direction === 1 ? -1 : 1;
    setDirection(newDirection);
    onDirectionChange(newDirection);
    setAnnouncement(`Direction: ${newDirection === 1 ? 'Apex' : 'Reverse'}`);
    heroRef.current?.updateScene(lastTimeRef.current, newDirection, !reduceMotion && !paused);
  };

  const handlePauseToggle = () => {
    const newPaused = !paused;
    setPaused(newPaused);
    onPauseChange(newPaused);
    setAnnouncement(newPaused ? 'Background paused.' : 'Background resumed.');
    heroRef.current?.updateScene(lastTimeRef.current, direction, !reduceMotion && !newPaused);
  };

  const handleReduceMotionToggle = () => {
    if (!getPrefersReducedMotion()) {
      const newReduced = !reduceMotion;
      setReduceMotion(newReduced);
      onMotionChange(!newReduced);
      if (newReduced) {
        setAnnouncement('Motion off (respects your system setting).');
      }
      heroRef.current?.updateScene(lastTimeRef.current, direction, !newReduced && !paused);
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      sliderRef.current?.blur();
    }
  };

  const motionDisabled = reduceMotion || paused;

  useEffect(() => {
    if (!heroRef.current) return;
    heroRef.current.updateScene(lastTimeRef.current, direction, !reduceMotion && !paused);
  }, [direction, reduceMotion, paused, heroRef]);

  return (
    <div 
      className="fixed top-4 right-4 z-40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl bg-black/40 backdrop-blur border border-white/10 p-2 shadow-lg"
      role="region"
      aria-label="Simulation controls">
      {/* Time Slider */}
      <div className="flex items-center gap-2">
        <label htmlFor="time-slider" className="text-xs text-white/70 sr-only sm:not-sr-only">
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
          className="w-24 sm:w-32 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{
            background: `linear-gradient(to right, #ffffff 0%, #ffffff ${time * 100}%, rgba(255, 255, 255, 0.2) ${time * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
          }}
        />
      </div>

      {/* Direction Toggle */}
      <button
        onClick={handleDirectionToggle}
        disabled={motionDisabled}
        aria-label="Switch travel direction"
        title="Switch travel direction"
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
      >
        {direction === 1 ? 'Apex →' : 'Reverse ←'}
      </button>

      {/* Pause Button */}
      <button
        onClick={handlePauseToggle}
        disabled={reduceMotion}
        aria-label={paused ? 'Resume background' : 'Pause background'}
        title={paused ? 'Resume background' : 'Pause background'}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
      >
        {paused ? 'Resume' : 'Pause'}
      </button>

      {/* Reduce Motion Toggle */}
      <button
        onClick={handleReduceMotionToggle}
        disabled={getPrefersReducedMotion()}
        aria-label="Disable background motion"
        title={reduceMotion ? 'Motion off' : 'Disable background motion'}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
      >
        {reduceMotion ? 'Motion off' : 'Reduce motion'}
      </button>

      {/* Aria-live announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}

