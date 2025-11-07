'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
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
    distanceMarkers: true,
    solarApex: true,
    labels: true,
    interstellarObjects: true,
    constellations: false,
  });

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const layerControlContent = (
    <div className="pointer-events-auto" data-ui="layer-control">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white text-sm hover:bg-black/80 transition-colors shadow-lg cursor-pointer"
        aria-label="Toggle layer controls"
        type="button"
        style={{ pointerEvents: 'auto', zIndex: 101 }}
      >
        {isOpen ? '✕ Close Layers' : '☰ Layers'}
      </button>
      
      {isOpen && (
        <div 
          className="mt-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg max-h-96 overflow-y-auto pointer-events-auto" 
          style={{ pointerEvents: 'auto', zIndex: 102 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-white text-xs font-semibold mb-2 uppercase tracking-wide">
            Simulation Components
          </h3>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(layers) as Array<keyof ComponentVisibility>).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggle(key);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
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

  if (!mounted) return null;

  // Render in a portal at body level to ensure it's above everything
  return createPortal(
    <>
      {/* Invisible overlay to capture clicks and prevent canvas from intercepting */}
      <div 
        className="fixed top-0 left-0 w-80 h-96 pointer-events-auto z-[9998] bg-transparent" 
        style={{ zIndex: 9998 }}
        onMouseDown={(e) => {
          // Only stop if not clicking on the button itself
          if (!(e.target as HTMLElement).closest('button')) {
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            e.stopPropagation();
          }
        }}
        onPointerDown={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            e.stopPropagation();
          }
        }}
      />
      {/* Actual layer control */}
      <div 
        className="fixed top-4 left-4 z-[9999] pointer-events-auto" 
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
        data-ui="layer-control"
      >
        {layerControlContent}
      </div>
    </>,
    document.body
  );
}
