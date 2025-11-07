'use client';

interface DateDisplayProps {
  year: number;
  speed: number; // years per second
}

export default function DateDisplay({ year, speed }: DateDisplayProps) {
  // Format year with decimal precision
  const formatYear = (y: number): string => {
    const wholeYear = Math.floor(y);
    const fraction = y - wholeYear;
    const days = Math.floor(fraction * 365.25);
    const date = new Date(wholeYear, 0, 1);
    date.setDate(date.getDate() + days);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    
    return `${wholeYear} ${month} ${day}`;
  };

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
          {formatYear(year)}
        </div>
        <div className="text-xs text-white/60">
          Speed: {formatSpeed(speed)}
        </div>
      </div>
    </div>
  );
}
