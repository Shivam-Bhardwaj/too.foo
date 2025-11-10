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
    <div className="w-full pointer-events-auto" data-ui="layer-control">
      <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.35em] text-white/60 mb-1.5 sm:mb-1">
        Layers
      </p>
      <div className="flex flex-wrap items-center justify-start gap-1 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 -mx-1 sm:mx-0 px-1">
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
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-[48px] sm:min-w-[56px] text-[0.65rem] sm:text-xs text-white border rounded transition-colors shrink-0 ${
                layers[key]
                  ? 'bg-white/30 border-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              } focus:outline-none focus:ring-2 focus:ring-white/50`}
            >
              {LAYER_LABELS[key]}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
