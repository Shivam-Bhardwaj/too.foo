'use client';

import { useEffect, useRef } from 'react';

const META_BLOCK = [
  { label: 'Mission', value: 'Solar Memory Online' },
  { label: 'Phase', value: 'Prelaunch Observatory' },
  { label: 'AO Window', value: '1977 → 2077' },
  { label: 'Coordinates', value: 'Heliopause Corridor' },
];

export default function MissionMetaHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--mission-meta-height', `${height}px`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <header
      ref={headerRef}
      className="relative z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/70">
            Too.Foo Continuum
          </p>
          <h1 className="text-2xl sm:text-4xl font-light text-white">
            Heliosphere Navigation &amp; Memory Stack
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl">
            Field console for our solar memory upload: a live heliosphere simulation fused with
            Voyager telemetry and magnetohydrodynamic models.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm w-full lg:w-auto">
          {META_BLOCK.map((entry) => (
            <div key={entry.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/50">
                {entry.label}
              </p>
              <p className="text-white text-base font-mono">
                {entry.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
