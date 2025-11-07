import { useEffect, useState } from 'react';
import type { SafeAreaInsets, ViewportSize } from '../responsiveLayout';

const DEFAULT_VIEWPORT: ViewportSize = { width: 1280, height: 720 };
const SAFE_TOP_VAR = '--sat';
const SAFE_BOTTOM_VAR = '--sab';

const readViewport = (): ViewportSize => {
  if (typeof window === 'undefined') {
    return DEFAULT_VIEWPORT;
  }

  const visual = window.visualViewport;
  if (visual) {
    return {
      width: Math.round(visual.width),
      height: Math.round(visual.height),
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const readSafeArea = (): SafeAreaInsets => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, bottom: 0 };
  }

  const styles = getComputedStyle(document.documentElement);
  const parseVar = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    top: parseVar(styles.getPropertyValue(SAFE_TOP_VAR) || '0'),
    bottom: parseVar(styles.getPropertyValue(SAFE_BOTTOM_VAR) || '0'),
  };
};

export function useViewportSize(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>(() => readViewport());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      setViewport(readViewport());
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  return viewport;
}

export function useSafeAreaInsets(): SafeAreaInsets {
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>(() => readSafeArea());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = () => {
      setSafeArea(readSafeArea());
    };

    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);

    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
    };
  }, []);

  return safeArea;
}
