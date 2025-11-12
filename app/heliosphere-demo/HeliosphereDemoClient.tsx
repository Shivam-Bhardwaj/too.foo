'use client';

import { useEffect, useRef, useState } from 'react';
import type { SunCentricSceneAPI } from '@/app/lib/SunCentricHeliosphereScene';

export default function HeliosphereDemoClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SunCentricSceneAPI | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Waiting for mount...');
  const [showValidation, setShowValidation] = useState(true);
  const [fps, setFps] = useState(60);

  // Ensure we're on client side
  useEffect(() => {
    console.log('[Demo] Component mounted on client');
    setStatus('Component mounted');
    setIsMounted(true);
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!isMounted || !canvasRef.current || isInitialized) return;

    let mounted = true;
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = 0;

    const initScene = async () => {
      try {
        console.log('[Demo] Step 1: Starting initialization...');
        console.log('[Demo] Canvas element:', canvasRef.current);
        
        setStatus('Loading scene module...');
        
        // Dynamic import to ensure client-side only
        console.log('[Demo] Step 2: Importing scene module...');
        const { createSunCentricScene: createScene } = await import('@/app/lib/SunCentricHeliosphereScene');
        console.log('[Demo] Step 3: Scene module loaded, calling createScene...');
        
        setStatus('Creating 3D scene...');
        const sceneAPI = await createScene(canvasRef.current!);
        console.log('[Demo] Step 4: Scene created successfully');
        
        if (!mounted) {
          sceneAPI.dispose();
          return;
        }

        sceneRef.current = sceneAPI;
        setIsInitialized(true);
        setError(null);
        setStatus('✅ Scene running');
        console.log('[Demo] Step 5: Scene initialized successfully, starting animation...');

        // Animation loop
        const animate = () => {
          if (!mounted || !sceneRef.current) return;

          const now = performance.now();
          const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap at 100ms
          lastTime = now;

          // Update scene
          sceneRef.current.update(dt);

          // FPS counter
          frameCount++;
          fpsTime += dt;
          if (fpsTime >= 1.0) {
            setFps(Math.round(frameCount / fpsTime));
            frameCount = 0;
            fpsTime = 0;
          }

          animationFrameId = requestAnimationFrame(animate);
        };

        animate();
      } catch (err) {
        console.error('[Demo] Failed to initialize scene:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initScene();

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement!;
        sceneRef.current.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [isInitialized, isMounted]);

  // Toggle validation overlays
  const handleToggleValidation = () => {
    if (sceneRef.current) {
      const newValue = !showValidation;
      sceneRef.current.toggleValidation(newValue);
      setShowValidation(newValue);
    }
  };

  // Time navigation (example: jump to +100 years)
  const handleTimeJump = async (years: number) => {
    if (sceneRef.current) {
      // J2000.0 epoch + years
      const j2000 = 2451545.0;
      const jd = j2000 + (years * 365.25);
      await sceneRef.current.setTime(jd);
    }
  };

  // Don't render until mounted (client-side)
  if (!isMounted) {
    return (
      <div className="relative h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
        suppressHydrationWarning
      />

      {/* Loading overlay */}
      {!isInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
            </div>
            <p className="text-xl">Initializing Sun-Centric Heliosphere...</p>
            <p className="text-sm text-gray-400 mt-2">{status}</p>
            <p className="text-xs text-gray-500 mt-1">Check console (F12) for details</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 text-white p-8">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Initialization Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400">
              Note: Dataset may not be generated yet. Run:
              <code className="block mt-2 p-2 bg-gray-800 rounded">
                python backend/precompute/generate_dataset.py
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Controls UI */}
      {isInitialized && (
        <>
          {/* Info panel */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg backdrop-blur-sm">
            <h1 className="text-xl font-bold mb-2">☀️ Sun-Centric Heliosphere</h1>
            <p className="text-sm text-gray-300 mb-2">
              Dataset-driven visualization with GPU rendering
            </p>
            <div className="text-xs space-y-1 text-gray-400">
              <div>FPS: <span className="text-cyan-400">{fps}</span></div>
              <div>Frame: <span className="text-cyan-400">HEE_J2000</span></div>
              <div>Units: <span className="text-cyan-400">AU</span></div>
              <div>Scale: <span className="text-cyan-400">1:1</span></div>
            </div>
          </div>

          {/* Control panel */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-semibold mb-2">Controls</h2>
            
            {/* Validation toggle */}
            <button
              onClick={handleToggleValidation}
              className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                showValidation 
                  ? 'bg-cyan-500 hover:bg-cyan-600' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {showValidation ? '✓' : '✗'} Validation Overlays
            </button>

            {/* Time controls */}
            <div className="border-t border-gray-600 pt-3">
              <p className="text-xs text-gray-400 mb-2">Time Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTimeJump(-100)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  -100 yr
                </button>
                <button
                  onClick={() => handleTimeJump(100)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  +100 yr
                </button>
                <button
                  onClick={() => handleTimeJump(-1000)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  -1000 yr
                </button>
                <button
                  onClick={() => handleTimeJump(1000)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  +1000 yr
                </button>
              </div>
            </div>

            {/* Camera controls hint */}
            <div className="border-t border-gray-600 pt-3 text-xs text-gray-400">
              <p className="font-semibold mb-1">Camera:</p>
              <p>• Drag: Rotate</p>
              <p>• Scroll: Zoom</p>
              <p>• Right-drag: Pan</p>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-sm font-semibold mb-2">Legend</h3>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded opacity-50"></div>
                <span>Heliopause (HP)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded opacity-50"></div>
                <span>Termination Shock (TS)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Sun</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span>Solar Apex (motion)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span>ISM Inflow (IBEX)</span>
              </div>
            </div>
          </div>

          {/* Architecture info */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg backdrop-blur-sm max-w-xs">
            <p className="text-xs text-gray-300">
              ✅ Sun-centric (HEE_J2000 frame)<br/>
              ✅ GPU particles (WebGL2 ping-pong)<br/>
              ✅ Instanced starfield (20k stars)<br/>
              ✅ Parametric surfaces (AU units)<br/>
              ✅ Validation overlays<br/>
            </p>
            <a 
              href="https://github.com/Shivam-Bhardwaj/too.foo/blob/issue-43/SUN_CENTRIC_ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
            >
              📖 Architecture Docs →
            </a>
          </div>
        </>
      )}
    </div>
  );
}

