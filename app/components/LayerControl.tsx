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

export default function LayerControl({ heroRef }: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState<ComponentVisibility>({
    heliosphere: true,
    helioglow: true,
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
    distanceMarkers: false, // Hidden by default - removed as meaningless artifact
    solarApex: false, // Hidden by default - removed as meaningless artifact
    labels: true,
    interstellarObjects: false, // Hidden by default - removed as meaningless artifacts
    constellations: false,
  });

  const handleToggle = (key: keyof ComponentVisibility) => {
    const newValue = !layers[key];
    setLayers(prev => ({ ...prev, [key]: newValue }));
    heroRef.current?.toggleComponent(key, newValue);
  };

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white text-sm hover:bg-black/80 transition-colors shadow-lg"
        aria-label="Toggle layer controls"
      >
        {isOpen ? '✕ Close Layers' : '☰ Layers'}
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg max-h-96 overflow-y-auto">
          <h3 className="text-white text-xs font-semibold mb-2 uppercase tracking-wide">
            Simulation Components
          </h3>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(layers) as Array<keyof ComponentVisibility>).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => handleToggle(key)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-white/90 text-sm select-none">
                  {LAYER_LABELS[key]}
                </span>
              </label>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/50 text-xs">
              Toggle components for scientific analysis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
