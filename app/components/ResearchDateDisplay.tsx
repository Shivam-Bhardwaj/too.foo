'use client';

import { useState, useEffect } from 'react';

export default function ResearchDateDisplay() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const handleDateUpdate = (e: CustomEvent<Date>) => {
      setCurrentDate(e.detail);
    };

    window.addEventListener('research-date-update', handleDateUpdate as EventListener);
    return () => {
      window.removeEventListener('research-date-update', handleDateUpdate as EventListener);
    };
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="text-2xl md:text-3xl font-mono font-light text-white">
      {formatDate(currentDate)}
    </div>
  );
}

