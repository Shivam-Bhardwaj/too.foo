'use client';

import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion, createMotionObserver } from '../lib/motion';
import { HeroRef } from './Hero';
import { linearToLogYear, yearToLinear, formatLogTime, yearsToSeconds } from '../lib/timeScale';

type Direction = 1 | -1;

interface ControlsProps {
  heroRef: React.RefObject<HeroRef>;
  onTimeChange: (time: number) => void;
  onDirectionChange: (direction: Direction) => void;
  onMotionChange: (enabled: boolean) => void;
  onPauseChange: (paused: boolean) => void;
}

// Speed presets: years per second (logarithmic scale)
const SPEED_PRESETS = [
  { label: '1x', value: 1 },           // 1 year/sec
  { label: '10x', value: 10 },         // 10 years/sec
  { label: '1 cycle', value: 11 },      // 11 years/sec (1 solar cycle per second)
  { label: '100x', value: 100 },       // 100 years/sec
  { label: '1K', value: 1000 },        // 1000 years/sec
  { label: '10K', value: 10000 },      // 10,000 years/sec
  { label: '100K', value: 100000 },    // 100,000 years/sec
];

// Logarithmic time range: 0.001 years to 1 million years
const MIN_LOG_YEARS = 0.001;
const MAX_LOG_YEARS = 1000000;

export default function Controls({
  heroRef,
  onTimeChange,
  onDirectionChange,
  onMotionChange,
  onPauseChange,
}: ControlsProps) {
  const [year, setYear] = useState(2024.0);
  const [speedIndex, setSpeedIndex] = useState(2); // Start at 1 solar cycle per second (11 years/sec)
  const [direction, setDirection] = useState<Direction>(1);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const sliderRef = useRef<HTMLInputElement>(null);
  const currentYearRef = useRef(2024.0);
  const targetYearRef = useRef(2024.0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Logarithmic slider value (0-1)
  const [logSliderValue, setLogSliderValue] = useState(yearToLinear(2024.0, MIN_LOG_YEARS, MAX_LOG_YEARS));

  const speed = SPEED_PRESETS[speedIndex].value;

  useEffect(() => {
    setAnnouncement(`Year: ${Math.floor(year)}. Speed: ${speed} years/sec.`);
  }, [year, speed]);

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
      try {
        heroRef.current?.updateScene(currentYearRef.current, direction, false);
      } catch (error) {
        console.error('Error updating scene on pause:', error);
      }
      return;
    }

    let lastFrameTime = performance.now();
    let isRunning = true;

    function animate(currentTime: number) {
      if (!isRunning) {
        animationFrameRef.current = null;
        return;
      }

      try {
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
          // Auto-advance time at selected speed (years per second)
          // speed is in years/sec, dt is in seconds
          finalYear = current + (speed * dt * direction);
          
          // Clamp to valid range
          finalYear = Math.max(MIN_LOG_YEARS, Math.min(MAX_LOG_YEARS, finalYear));
          
          currentYearRef.current = finalYear;
          targetYearRef.current = finalYear;
          setYear(finalYear);
          
          // Update slider position to match
          const newLogValue = yearToLinear(finalYear, MIN_LOG_YEARS, MAX_LOG_YEARS);
          setLogSliderValue(newLogValue);
          onTimeChange(finalYear);
        }
        
        // Update scene
        heroRef.current?.updateScene(finalYear, direction, true);
      } catch (error) {
        console.error('Error in animation loop:', error);
        isRunning = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      if (isRunning && !reduceMotion && !paused) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [reduceMotion, paused, direction, speed, onTimeChange, heroRef]);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const linearValue = parseFloat(e.target.value);
    const value = linearToLogYear(linearValue, MIN_LOG_YEARS, MAX_LOG_YEARS);
    targetYearRef.current = value;
    currentYearRef.current = value;
    setYear(value);
    setLogSliderValue(linearValue);
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

  return (
    <>
      {/* Controls - Header section (one line) */}
      <div 
        className="flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur border border-white/10 px-4 py-2 shadow-lg"
        role="region"
        aria-label="Simulation controls">
        
        {/* Logarithmic Time Slider */}
        <div className="flex items-center gap-2">
          <label htmlFor="year-slider" className="text-xs text-white/70 whitespace-nowrap">
            Time: {formatLogTime(yearsToSeconds(year))}
          </label>
          <input
            id="year-slider"
            ref={sliderRef}
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={logSliderValue}
            onChange={handleYearChange}
            onKeyDown={handleSliderKeyDown}
            disabled={motionDisabled}
            aria-label="Time (logarithmic scale)"
            title="Scrub through time (logarithmic scale)"
            className="w-32 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/50"
            style={{
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${logSliderValue * 100}%, rgba(255, 255, 255, 0.2) ${logSliderValue * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
            }}
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/20"></div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
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

        {/* Divider */}
        <div className="h-6 w-px bg-white/20"></div>

        {/* Direction and Control Buttons */}
        <div className="flex items-center gap-1">
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