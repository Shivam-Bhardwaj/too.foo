import { describe, it, expect } from 'vitest';
import { getHeroViewportMetrics, getControlDockLayout } from '@/app/lib/responsiveLayout';

describe('getHeroViewportMetrics', () => {
  it('prioritizes portrait-safe height on phones', () => {
    const metrics = getHeroViewportMetrics(
      { width: 390, height: 844 },
      { top: 47, bottom: 34 }
    );

    expect(metrics.orientation).toBe('portrait');
    expect(metrics.height).toBeGreaterThan(650);
    expect(metrics.height).toBeLessThanOrEqual(763); // limited by safe area adjusted height
    expect(metrics.scale).toBeGreaterThan(0.8);
  });

  it('clamps hero height when safe area leaves little space', () => {
    const metrics = getHeroViewportMetrics(
      { width: 375, height: 600 },
      { top: 120, bottom: 120 }
    );

    expect(metrics.height).toBeCloseTo(360, 0);
    expect(metrics.scale).toBeCloseTo(1, 2);
  });

  it('uses cinematic aspect ratio on desktop landscape viewports', () => {
    const metrics = getHeroViewportMetrics(
      { width: 1366, height: 768 }
    );

    expect(metrics.orientation).toBe('landscape');
    expect(metrics.height).toBeCloseTo(768, 0);
    expect(metrics.targetAspect).toBeCloseTo(16 / 9, 5);
  });
});

describe('getControlDockLayout', () => {
  it('stacks controls on very small phones', () => {
    expect(getControlDockLayout({ width: 360 })).toBe('stacked');
  });

  it('switches to compact layout on phablets', () => {
    expect(getControlDockLayout({ width: 640 })).toBe('compact');
  });

  it('keeps inline layout on desktop', () => {
    expect(getControlDockLayout({ width: 1280 })).toBe('inline');
  });
});
