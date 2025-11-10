'use client';

import { useState, useEffect } from 'react';
import { HeroRef } from './Hero';
import { ComponentVisibility } from '../lib/heliosphereScene';

interface LayerControlProps {
  heroRef: React.RefObject<HeroRef>;
}

const LAYER_LABELS: Record<keyof ComponentVisibility, string> = {
  heliosphere: 'Heliosphere Surface',
  helioglow: 'Helioglow (UV)',
  terminationShock: 'Termination Shock',
  bowShock: 'Bow Shock (Theoretical)',
  solarWind: 'Solar Wind Streams',
  interstellarWind: 'Interstellar Wind',
  planets: 'Planets',
  orbits: 'Planetary Orbits',
  moon: 'Moon',
  stars: 'Background Stars',
  famousStars: 'Famous Stars',
  voyagers: 'Voyager Spacecraft',
  distanceMarkers: 'Distance Markers (AU)',
  solarApex: 'Solar Apex Direction',
  labels: 'Object Labels',
  interstellarObjects: 'Interstellar Objects',
  constellations: 'Constellations',
};

// Group layers into logical categories
const LAYER_GROUPS: Array<{
  name: string;
  keys: Array<keyof ComponentVisibility>;
}> = [
  {
    name: 'Heliosphere',
    keys: ['heliosphere', 'helioglow', 'terminationShock', 'bowShock'],
  },
  {
    name: 'Plasma',
    keys: ['solarWind', 'interstellarWind'],
  },
  {
    name: 'Solar System',
    keys: ['planets', 'orbits', 'moon'],
  },
  {
    name: 'Spacecraft',
    keys: ['voyagers'],
  },
  {
    name: 'Reference',
    keys: ['stars', 'famousStars', 'constellations'],
  },
  {
    name: 'Markers',
    keys: ['distanceMarkers', 'solarApex', 'labels', 'interstellarObjects'],
  },
];

export default function LayerControl({ heroRef }: LayerControlProps) {
  const [layers, setLayers] = useState<ComponentVisibility>({
    heliosphere: true,
    helioglow: false,
    terminationShock: true,
    bowShock: false,
    solarWind: true,
    interstellarWind: true,
    planets: true,
    orbits: true,
    moon: true,
    stars: true,
    famousStars: true,
    voyagers: true,
    distanceMarkers: false,
    solarApex: false,
    labels: true,
    interstellarObjects: false,
    constellations: false,
  });

  // Sync initial state with scene visibility
  useEffect(() => {
    if (heroRef.current) {
      const sceneVisibility = heroRef.current.getVisibility();
      if (sceneVisibility) {
        setLayers(sceneVisibility);
      }
    }
  }, [heroRef]);

  const handleToggle = (key: keyof ComponentVisibility) => {
    const newValue = !layers[key];
    setLayers(prev => ({ ...prev, [key]: newValue }));
    heroRef.current?.toggleComponent(key, newValue);
  };

  return (
    <div className="flex items-center gap-1 pointer-events-auto" data-ui="layer-control">
      <span className="text-[0.4rem] sm:text-[0.5rem] uppercase tracking-[0.2em] text-white/60 whitespace-nowrap">
        Layers:
      </span>
      <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5" style={{ scrollbarWidth: 'thin' }}>
        {LAYER_GROUPS.flatMap((group) =>
          group.keys.map((key) => (
            <button
              key={key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(key);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={`Toggle ${LAYER_LABELS[key]}`}
              title={LAYER_LABELS[key]}
              className={`px-1 py-0.5 min-w-[40px] text-[0.5rem] sm:text-[0.55rem] text-white border rounded transition-colors shrink-0 ${
                layers[key]
                  ? 'bg-white/30 border-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              } focus:outline-none focus:ring-1 focus:ring-white/50`}
            >
              {LAYER_LABELS[key]}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
