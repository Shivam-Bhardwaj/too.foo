'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { createResearchGradeScene, SceneAPI, ComponentVisibility, TimeMode } from '../lib/ResearchGradeHeliosphereScene';
import { TimeControls } from './TimeControls';
import { DataOverlay } from './DataOverlay';
import { getAstronomicalDataService } from '../lib/services/AstronomicalDataService';
import { VoyagerTrajectories } from '../lib/physics/SpacecraftTrajectories';
import { JulianDate } from '../lib/data/AstronomicalDataStore';

export type ResearchHeroRef = {
  updateScene: (date: Date, timeSpeed: number, motionEnabled: boolean) => void;
  toggleComponent: (component: keyof ComponentVisibility, visible: boolean) => void;
  getVisibility: () => ComponentVisibility;
  setTimeMode: (mode: TimeMode) => void;
  getCurrentDate: () => Date;
};

interface ResearchGradeHeroProps {
  onDateChange?: (date: Date) => void;
}

const ResearchGradeHero = forwardRef<ResearchHeroRef, ResearchGradeHeroProps>((props, ref) => {
  const { onDateChange } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneAPI | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentDateRef = useRef<Date>(new Date());
  const timeSpeedRef = useRef<number>(11 * 365.25 / 60);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  
  const [webglSupported, setWebglSupported] = useState(true);
  const [initFailed, setInitFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Time state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeSpeed, setTimeSpeed] = useState(11 * 365.25 / 60); // 11 years per second (1 solar cycle)
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeMode, setTimeMode] = useState<TimeMode>('realtime');
  
  // Data overlay state
  const [showDataOverlay, setShowDataOverlay] = useState(true);
  const [voyagerData, setVoyagerData] = useState({
    voyager1: {
      name: 'Voyager 1',
      distance: 163,
      velocity: 17.0,
      lightTime: 22.6,
      position: { lon: 35.2, lat: 34.9 },
      status: 'active' as 'active' | 'inactive',
      lastMilestone: 'Interstellar space since 2012'
    },
    voyager2: {
      name: 'Voyager 2',
      distance: 136,
      velocity: 15.4,
      lightTime: 18.8,
      position: { lon: 311.0, lat: -32.5 },
      status: 'active' as 'active' | 'inactive',
      lastMilestone: 'Interstellar space since 2018'
    }
  });
  
  const [solarWindData, setSolarWindData] = useState({
    speed: 400,
    density: 5,
    temperature: 1.2e5,
    pressure: 2.0,
    magneticField: 5
  });
  
  const [sunspotNumber, setSunspotNumber] = useState(100);
  
  useImperativeHandle(ref, () => ({
    updateScene: (date: Date, speed: number, motionEnabled: boolean) => {
      if (sceneRef.current) {
        sceneRef.current.update(date, speed, motionEnabled);
      }
    },
    toggleComponent: (component: keyof ComponentVisibility, visible: boolean) => {
      if (sceneRef.current) {
        sceneRef.current.toggleComponent(component, visible);
      }
    },
    getVisibility: () => {
      if (sceneRef.current) {
        return sceneRef.current.getVisibility();
      }
      return {
        heliosphere: true,
        terminationShock: true,
        heliopause: true,
        bowShock: false,
        solarWind: true,
        interstellarWind: true,
        planets: true,
        orbits: true,
        spacecraft: true,
        trajectories: true,
        stars: true,
        coordinateGrid: false,
        distanceMarkers: true,
        dataOverlay: true
      };
    },
    setTimeMode: (mode: TimeMode) => {
      if (sceneRef.current) {
        sceneRef.current.setTimeMode(mode);
        setTimeMode(mode);
      }
    },
    getCurrentDate: () => {
      if (sceneRef.current) {
        return sceneRef.current.getCurrentDate();
      }
      return currentDate;
    }
  }));

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.dataset.sceneReady = 'false';

    // Check WebGL support
    const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
    if (!gl) {
      setWebglSupported(false);
      setInitFailed(true);
      canvasRef.current.dataset.sceneReady = 'failed';
      return;
    }

    let cleanupFn: (() => void) | null = null;

    const initScene = async () => {
      try {
        setLoading(true);
        const scene = await createResearchGradeScene(canvasRef.current!);
        sceneRef.current = scene;

        const handleResize = () => {
          if (canvasRef.current && sceneRef.current) {
            try {
              const rect = canvasRef.current.getBoundingClientRect();
              sceneRef.current.resize(rect.width, rect.height);
            } catch (error) {
              console.error('Error in resize handler:', error);
            }
          }
        };

        resizeHandlerRef.current = handleResize;
        handleResize();
        window.addEventListener('resize', handleResize);
        
        // Initial render
        // When not playing, just update the scene without advancing time
        scene.update(currentDateRef.current, 0, false);
        
        // Notify parent component of initial date
        if (onDateChange) {
          onDateChange(currentDateRef.current);
        }
        
        setLoading(false);
        if (canvasRef.current) {
          canvasRef.current.dataset.sceneReady = 'true';
        }
        window.dispatchEvent(new CustomEvent('research-scene-ready'));

        cleanupFn = () => {
          window.removeEventListener('resize', handleResize);
          resizeHandlerRef.current = null;
          try {
            scene.dispose();
          } catch (error) {
            console.error('Error disposing scene:', error);
          }
          sceneRef.current = null;
          if (canvasRef.current) {
            canvasRef.current.dataset.sceneReady = 'false';
          }
        };
      } catch (error) {
        console.error('Failed to initialize WebGL scene:', error);
        setInitFailed(true);
        setLoading(false);
        if (canvasRef.current) {
          canvasRef.current.dataset.sceneReady = 'failed';
        }
      }
    };

    initScene();

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [onDateChange]);

  // Update data overlay - memoized to avoid stale closures
  const updateDataOverlay = useCallback((date: Date) => {
    try {
      const dataService = getAstronomicalDataService();
      const jd = JulianDate.fromDate(date);
      
      // Update Voyager positions
      const dataStore = dataService.getDataStore();
      const v1Pos = dataStore.getSpacecraftPosition('Voyager 1', jd);
      const v2Pos = dataStore.getSpacecraftPosition('Voyager 2', jd);
      
      if (v1Pos && v2Pos) {
        setVoyagerData({
          voyager1: {
            name: 'Voyager 1',
            distance: v1Pos.distance,
            velocity: v1Pos.velocity.length(),
            lightTime: v1Pos.lightTime / 60, // Convert to hours
            position: { 
              lon: VoyagerTrajectories.VOYAGER_1.current.heliocentricLongitude,
              lat: VoyagerTrajectories.VOYAGER_1.current.heliocentricLatitude
            },
            status: (date.getFullYear() < 2025 ? 'active' : 'inactive') as 'active' | 'inactive',
            lastMilestone: v1Pos.distance > 121 ? 'Interstellar space since 2012' : 
                          v1Pos.distance > 94 ? 'Passed termination shock' : 'En route'
          },
          voyager2: {
            name: 'Voyager 2',
            distance: v2Pos.distance,
            velocity: v2Pos.velocity.length(),
            lightTime: v2Pos.lightTime / 60,
            position: {
              lon: VoyagerTrajectories.VOYAGER_2.current.heliocentricLongitude,
              lat: VoyagerTrajectories.VOYAGER_2.current.heliocentricLatitude
            },
            status: (date.getFullYear() < 2030 ? 'active' : 'inactive') as 'active' | 'inactive',
            lastMilestone: v2Pos.distance > 119 ? 'Interstellar space since 2018' : 
                          v2Pos.distance > 83 ? 'Passed termination shock' : 'En route'
          }
        });
      }
      
      // Update solar wind data
      const solarWind = dataService.getSolarWindConditions(date, 1);
      setSolarWindData({
        speed: solarWind.speed,
        density: solarWind.density,
        temperature: solarWind.temperature,
        pressure: solarWind.pressure,
        magneticField: solarWind.magneticField.length() // Convert Vector3 to magnitude
      });
      
      // Update sunspot number
      const solarCycle = dataService.getDataStore().solarCycle;
      if (solarCycle && solarCycle.sunspotNumber) {
        setSunspotNumber(solarCycle.sunspotNumber.interpolate(jd));
      }
    } catch (error) {
      console.error('Error updating data overlay:', error);
    }
  }, []);

  // Animation loop - use refs to avoid dependency issues
  useEffect(() => {
    // Update refs when state changes
    currentDateRef.current = currentDate;
    timeSpeedRef.current = timeSpeed;
  }, [currentDate, timeSpeed]);

  useEffect(() => {
    if (!sceneRef.current || !isPlaying) {
      // Cancel any running animation if not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let isRunning = true;

    const animate = () => {
      if (!isRunning || !sceneRef.current || !isPlaying) {
        animationFrameRef.current = null;
        return;
      }

      try {
        // Update date - timeSpeed is in days per frame
        const msPerDay = 24 * 60 * 60 * 1000;
        const current = currentDateRef.current;
        const speed = timeSpeedRef.current;
        const newDate = new Date(current.getTime() + speed * msPerDay);
        
        // Update ref immediately
        currentDateRef.current = newDate;
        
        // Update state (but don't depend on it in this effect)
        setCurrentDate(newDate);
        
        // Notify parent component of date change
        if (onDateChange) {
          onDateChange(newDate);
        }
        
        // Update scene
        if (sceneRef.current) {
          sceneRef.current.update(newDate, speed, true);
        }
        
        // Update data overlay
        updateDataOverlay(newDate);
      } catch (error) {
        console.error('Error in animation loop:', error);
        // Stop animation on error
        isRunning = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      if (isRunning && isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, updateDataOverlay]);

  // Event handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDateChange = (date: Date) => {
    currentDateRef.current = date;
    setCurrentDate(date);
    
    // Notify parent component of date change
    if (onDateChange) {
      onDateChange(date);
    }
    
    if (sceneRef.current) {
      try {
        sceneRef.current.update(date, timeSpeedRef.current, false);
      } catch (error) {
        console.error('Error updating scene on date change:', error);
      }
    }
    updateDataOverlay(date);
  };

  const handleTimeSpeedChange = (speed: number) => {
    timeSpeedRef.current = speed;
    setTimeSpeed(speed);
  };

  const handleTimeModeChange = (mode: TimeMode) => {
    setTimeMode(mode);
    if (sceneRef.current) {
      sceneRef.current.setTimeMode(mode);
      const newDate = sceneRef.current.getCurrentDate();
      setCurrentDate(newDate);
      
      // Notify parent component of date change
      if (onDateChange) {
        onDateChange(newDate);
      }
      
      updateDataOverlay(newDate);
    }
  };

  if (initFailed || !webglSupported) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-center p-8">
          <h2 className="text-2xl font-bold mb-4">WebGL Not Supported</h2>
          <p className="mb-4">This visualization requires WebGL support.</p>
          <img
            src="/img/heliosphere-still.png"
            alt="Heliosphere visualization"
            className="max-w-2xl mx-auto rounded-lg opacity-50"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
        data-testid="research-scene-canvas"
        data-scene-ready="false"
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
            <p>Loading astronomical data...</p>
          </div>
        </div>
      )}
      
      {!loading && (
        <>
          {/* Time controls */}
          <TimeControls
            currentDate={currentDate}
            onDateChange={handleDateChange}
            timeSpeed={timeSpeed}
            onTimeSpeedChange={handleTimeSpeedChange}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            timeMode={timeMode}
            onTimeModeChange={handleTimeModeChange}
          />
          
          {/* Data overlay */}
          {showDataOverlay && (
            <DataOverlay
              voyager1={voyagerData.voyager1}
              voyager2={voyagerData.voyager2}
              solarWind={solarWindData}
              sunspotNumber={sunspotNumber}
              currentDate={currentDate}
              showDetails={true}
            />
          )}
          
          {/* Toggle overlay button */}
          <button
            className="fixed top-4 left-4 bg-gray-800/80 hover:bg-gray-700/80 text-white px-4 py-2 rounded-lg transition-colors"
            onClick={() => setShowDataOverlay(!showDataOverlay)}
          >
            {showDataOverlay ? 'Hide' : 'Show'} Data
          </button>
        </>
      )}
    </>
  );
});

ResearchGradeHero.displayName = 'ResearchGradeHero';

export default ResearchGradeHero;
