'use client';

import { formatLogTime, yearsToSeconds } from '../lib/timeScale';

interface DateDisplayProps {
  year: number;
  speed: number; // years per second
}

export default function DateDisplay({ year, speed }: DateDisplayProps) {
  // Format time with appropriate units (logarithmic scale)
  const timeDisplay = formatLogTime(yearsToSeconds(year));
  
  // Format speed display
  const formatSpeed = (s: number): string => {
    if (s < 1) {
      return `${(s * 365.25).toFixed(1)} days/sec`;
    } else if (s < 365.25) {
      return `${s.toFixed(1)} years/sec`;
    } else if (s < 365250) {
      return `${(s / 365.25).toFixed(1)} centuries/sec`;
    } else {
      return `${(s / 365250).toFixed(1)} millennia/sec`;
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 shadow-lg">
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-mono font-light text-white">
          {timeDisplay}
        </div>
        <div className="text-xs text-white/60">
          Speed: {formatSpeed(speed)}
        </div>
      </div>
    </div>
  );
}
