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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const handleToggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSelectAll = () => {
    const allKeys = LAYER_GROUPS.flatMap(g => g.keys);
    const newLayers = { ...layers };
    allKeys.forEach(key => {
      newLayers[key] = true;
      heroRef.current?.toggleComponent(key, true);
    });
    setLayers(newLayers);
  };

  const handleSelectNone = () => {
    const allKeys = LAYER_GROUPS.flatMap(g => g.keys);
    const newLayers = { ...layers };
    allKeys.forEach(key => {
      newLayers[key] = false;
      heroRef.current?.toggleComponent(key, false);
    });
    setLayers(newLayers);
  };

  const activeCount = Object.values(layers).filter(Boolean).length;
  const totalCount = Object.keys(layers).length;

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0 pointer-events-auto" data-ui="layer-control">
      {/* Mobile: Button to open modal | Desktop: Label */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[0.65rem] sm:text-[0.4rem] lg:text-[0.5rem] uppercase tracking-[0.2em] text-white/60 whitespace-nowrap">
          Layers:
        </span>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="sm:hidden min-h-[44px] px-2 py-2 text-[0.75rem] text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 active:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          aria-label={`Toggle layers panel (${activeCount}/${totalCount} active)`}
        >
          {activeCount}/{totalCount} {isMobileOpen ? '−' : '+'}
        </button>
      </div>

      {/* Mobile: Modal | Desktop: Inline buttons */}
      {isMobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="bg-black/90 border border-white/20 rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Layer Controls</h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="min-h-[44px] min-w-[44px] px-2 text-white/60 hover:text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Close layers panel"
              >
                ×
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="flex-1 min-h-[44px] px-3 py-2 text-[0.75rem] text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 active:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="flex-1 min-h-[44px] px-3 py-2 text-[0.75rem] text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 active:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
              >
                Select None
              </button>
            </div>

            {/* Layer Groups */}
            <div className="space-y-2">
              {LAYER_GROUPS.map((group) => (
                <div key={group.name} className="border border-white/10 rounded">
                  <button
                    onClick={() => handleToggleGroup(group.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[0.75rem] text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                  >
                    <span className="font-medium">{group.name}</span>
                    <span>{expandedGroups.has(group.name) ? '−' : '+'}</span>
                  </button>
                  {expandedGroups.has(group.name) && (
                    <div className="p-2 space-y-1">
                      {group.keys.map((key) => (
                        <button
                          key={key}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggle(key);
                          }}
                          className={`w-full text-left min-h-[44px] px-3 py-2 text-[0.7rem] text-white border rounded transition-colors ${
                            layers[key]
                              ? 'bg-white/30 border-white/40'
                              : 'bg-white/10 border-white/20 hover:bg-white/20 active:bg-white/25'
                          } focus:outline-none focus:ring-2 focus:ring-white/50`}
                        >
                          {LAYER_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Inline buttons */}
      <div className="hidden sm:flex flex-wrap items-center gap-0.5 flex-1 min-w-0">
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
              className={`px-1 py-0.5 text-[0.5rem] lg:text-[0.55rem] text-white border rounded transition-colors ${
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
