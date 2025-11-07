import { describe, expect, it } from 'vitest';
import { HeliosphereModel } from '../app/lib/physics/HeliosphereModel';

describe('HeliosphereModel.generateParametricSurface', () => {
  const model = new HeliosphereModel();
  const jd = 0;

  it('creates a populated termination shock geometry', () => {
    const geometry = model.generateParametricSurface('terminationShock', jd, 8);
    const positions = geometry.getAttribute('position');

    expect(positions).toBeDefined();
    expect(positions.count).toBeGreaterThan(0);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
  });

  it('provides a geometry even when bow shock distances vanish', () => {
    const geometry = model.generateParametricSurface('bowShock', jd, 8);
    const positions = geometry.getAttribute('position');

    expect(positions).toBeDefined();
    expect(positions.count).toBeGreaterThan(0);
  });
});
