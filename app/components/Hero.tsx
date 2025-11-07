'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createScene, SceneAPI } from '../lib/heliosphereScene';

export type HeroRef = {
  updateScene: (normTime: number, direction: 1 | -1, motionEnabled: boolean) => void;
};

const Hero = forwardRef<HeroRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneAPI | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [initFailed, setInitFailed] = useState(false);

  useImperativeHandle(ref, () => ({
    updateScene: (normTime: number, direction: 1 | -1, motionEnabled: boolean) => {
      if (sceneRef.current) {
        sceneRef.current.update(normTime, direction, motionEnabled);
      }
    },
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check WebGL support
    const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
    if (!gl) {
      setWebglSupported(false);
      setInitFailed(true);
      return;
    }

    try {
      const scene = createScene(canvasRef.current);
      sceneRef.current = scene;

      const handleResize = () => {
        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          scene.resize(rect.width, rect.height);
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        sceneRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize WebGL scene:', error);
      setInitFailed(true);
    }
  }, []);

  if (initFailed || !webglSupported) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/img/heliosphere-still.png"
          alt="Stylized, scientifically-informed heliosphere; apex direction implied."
          className="w-full h-full object-cover opacity-50"
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
});

Hero.displayName = 'Hero';

export default Hero;

