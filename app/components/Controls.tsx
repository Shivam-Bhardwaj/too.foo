'use client';

import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion, createMotionObserver } from '../lib/motion';
import { HeroRef } from './Hero';
import DateDisplay from './DateDisplay';

type Direction = 1 | -1;

interface ControlsProps {
  heroRef: React.RefObject<HeroRef>;
  onTimeChange: (time: number) => void;
  onDirectionChange: (direction: Direction) => void;
  onMotionChange: (enabled: boolean) => void;
  onPauseChange: (paused: boolean) => void;
}

// Speed presets: years per second
const SPEED_PRESETS = [
  { label: '1x', value: 1 },           // 1 year/sec
  { label: '10x', value: 10 },         // 10 years/sec
  { label: '100x', value: 100 },       // 100 years/sec (century/sec)
  { label: '1K', value: 1000 },        // 1000 years/sec
  { label: '10K', value: 10000 },      // 10,000 years/sec
  { label: '100K', value: 100000 },    // 100,000 years/sec
];

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export default function Controls({
  heroRef,
  onTimeChange,
  onDirectionChange,
  onMotionChange,
  onPauseChange,
}: ControlsProps) {
  const [year, setYear] = useState(2024.0);
  const [speedIndex, setSpeedIndex] = useState(1); // Start at 10x
  const [direction, setDirection] = useState<Direction>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const sliderRef = useRef<HTMLInputElement>(null);
  const currentYearRef = useRef(2024.0);
  const targetYearRef = useRef(2024.0);
  const animationFrameRef = useRef<number | null>(null);

  const speed = SPEED_PRESETS[speedIndex].value;

  useEffect(() => {
    setAnnouncement(`Year: ${Math.floor(year)}. Speed: ${speed} years/sec.`);
    onTimeChange(year);
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
      heroRef.current?.updateScene(currentYearRef.current, direction, !reduced && !paused);
    });

    return cleanup;
  }, [onMotionChange, heroRef, direction, paused]);

  useEffect(() => {
    if (reduceMotion || paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      heroRef.current?.updateScene(currentYearRef.current, direction, false);
      return;
    }

    let lastFrameTime = performance.now();

    function animate(currentTime: number) {
      const dt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;

      // Smooth seek to target if user scrubbed
      const current = currentYearRef.current;
      const target = targetYearRef.current;
      let finalYear: number;
      
      if (Math.abs(current - target) > 0.01) {
        // Smooth interpolation to target year
        const alpha = Math.min(0.15, dt * 5);
        finalYear = current + (target - current) * alpha;
        currentYearRef.current = finalYear;
        setYear(finalYear);
        onTimeChange(finalYear);
      } else {
        // Auto-advance time at selected speed
        finalYear = current + (dt * speed * direction);
        currentYearRef.current = finalYear;
        targetYearRef.current = finalYear;
        setYear(finalYear);
        onTimeChange(finalYear);
      }
      
      // Update scene
      heroRef.current?.updateScene(finalYear, direction, true);

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [reduceMotion, paused, direction, speed, onTimeChange]);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    targetYearRef.current = value;
    currentYearRef.current = value;
    setYear(value);
    onTimeChange(value);
    heroRef.current?.updateScene(value, direction, !reduceMotion && !paused);
  };

  const handleSpeedChange = (newIndex: number) => {
    setSpeedIndex(newIndex);
    setAnnouncement(`Speed: ${SPEED_PRESETS[newIndex].label} (${SPEED_PRESETS[newIndex].value} years/sec)`);
  };

  const handleDirectionToggle = () => {
    const newDirection = direction === 1 ? -1 : 1;
    setDirection(newDirection);
    onDirectionChange(newDirection);
    setAnnouncement(`Direction: ${newDirection === 1 ? 'Forward' : 'Reverse'}`);
    heroRef.current?.updateScene(currentYearRef.current, newDirection, !reduceMotion && !paused);
  };

  const handlePauseToggle = () => {
    const newPaused = !paused;
    setPaused(newPaused);
    onPauseChange(newPaused);
    setAnnouncement(newPaused ? 'Paused.' : 'Resumed.');
    heroRef.current?.updateScene(currentYearRef.current, direction, !reduceMotion && !newPaused);
  };

  const handleReduceMotionToggle = () => {
    if (!getPrefersReducedMotion()) {
      const newReduced = !reduceMotion;
      setReduceMotion(newReduced);
      onMotionChange(!newReduced);
      if (newReduced) {
        setAnnouncement('Motion off (respects your system setting).');
      }
      heroRef.current?.updateScene(currentYearRef.current, direction, !newReduced && !paused);
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      sliderRef.current?.blur();
    }
  };

  const motionDisabled = reduceMotion || paused;
  const yearPercent = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  useEffect(() => {
    if (!heroRef.current) return;
    heroRef.current.updateScene(currentYearRef.current, direction, !reduceMotion && !paused);
  }, [direction, reduceMotion, paused, heroRef]);

  return (
    <>
      {/* Date Display */}
      <DateDisplay year={year} speed={speed} />

      {/* Controls */}
      <div 
        className="fixed top-4 right-4 z-40 flex flex-col gap-2 rounded-2xl bg-black/40 backdrop-blur border border-white/10 p-3 shadow-lg"
        role="region"
        aria-label="Simulation controls">
        
        {/* Year Slider */}
        <div className="flex flex-col gap-1">
          <label htmlFor="year-slider" className="text-xs text-white/70">
            Year: {Math.floor(year).toFixed(0)}
          </label>
          <input
            id="year-slider"
            ref={sliderRef}
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step="0.1"
            value={year}
            onChange={handleYearChange}
            onKeyDown={handleSliderKeyDown}
            disabled={motionDisabled}
            aria-label="Year"
            title="Scrub through years"
            className="w-48 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${yearPercent}%, rgba(255, 255, 255, 0.2) ${yearPercent}%, rgba(255, 255, 255, 0.2) 100%)`,
            }}
          />
        </div>

        {/* Speed Controls */}
        <div className="flex flex-wrap gap-1">
          {SPEED_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handleSpeedChange(index)}
              disabled={motionDisabled}
              aria-label={`Set speed to ${preset.label}`}
              title={`${preset.value} years per second`}
              className={`px-2 py-1 text-xs text-white border rounded transition-colors ${
                speedIndex === index
                  ? 'bg-white/30 border-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Direction and Control Buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={handleDirectionToggle}
            disabled={motionDisabled}
            aria-label="Switch travel direction"
            title="Switch travel direction"
            className="px-2 py-1 text-xs text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          >
            {direction === 1 ? '▶' : '◀'}
          </button>

          <button
            onClick={handlePauseToggle}
            disabled={reduceMotion}
            aria-label={paused ? 'Resume' : 'Pause'}
            title={paused ? 'Resume' : 'Pause'}
            className="px-2 py-1 text-xs text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          >
            {paused ? '▶' : '⏸'}
          </button>

          <button
            onClick={handleReduceMotionToggle}
            disabled={getPrefersReducedMotion()}
            aria-label="Disable background motion"
            title={reduceMotion ? 'Motion off' : 'Disable background motion'}
            className="px-2 py-1 text-xs text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          >
            {reduceMotion ? 'Motion off' : 'Reduce'}
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
      </div>
    </>
  );
}