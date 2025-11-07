export type ViewportSize = {
  width: number;
  height: number;
};

export type SafeAreaInsets = {
  top?: number;
  bottom?: number;
};

export type HeroViewportMetrics = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  aspect: number;
  targetAspect: number;
  scale: number;
};

const MIN_DIMENSION = 320;

export function getHeroViewportMetrics(
  viewport: ViewportSize,
  safeArea: SafeAreaInsets = {}
): HeroViewportMetrics {
  const width = Math.max(viewport.width, MIN_DIMENSION);
  const rawHeight = Math.max(viewport.height, MIN_DIMENSION);
  const safeTop = Math.max(safeArea.top ?? 0, 0);
  const safeBottom = Math.max(safeArea.bottom ?? 0, 0);
  const availableHeight = Math.max(rawHeight - safeTop - safeBottom, MIN_DIMENSION);

  const orientation: HeroViewportMetrics['orientation'] =
    rawHeight >= width ? 'portrait' : 'landscape';

  const targetAspect = orientation === 'portrait' ? 9 / 16 : 16 / 9;
  const desiredHeightFromWidth = width / targetAspect;
  const height = Math.min(Math.max(desiredHeightFromWidth, MIN_DIMENSION), availableHeight);
  const aspect = width / height;
  const scale = Number((height / availableHeight).toFixed(3));

  return {
    width,
    height,
    orientation,
    aspect,
    targetAspect,
    scale,
  };
}

export type ControlDockLayout = 'stacked' | 'compact' | 'inline';

export function getControlDockLayout(viewport: Pick<ViewportSize, 'width'>): ControlDockLayout {
  if (viewport.width <= 480) return 'stacked';
  if (viewport.width <= 900) return 'compact';
  return 'inline';
}
