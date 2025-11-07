import { describe, expect, it } from 'vitest';
import { HeliosphereModel } from '../app/lib/physics/HeliosphereModel';

describe('HeliosphereModel.generateParametricSurface', () => {
  const model = new HeliosphereModel();
  const jd = 0;

  it('creates populated termination shock geometry', () => {
    const geometry = model.generateParametricSurface('terminationShock', jd, 8);
    const positions = geometry.getAttribute('position');
    expect(positions).toBeDefined();
    expect(positions.count).toBeGreaterThan(0);
  });

  it('maintains geometry when bow shock distances collapse', () => {
    const geometry = model.generateParametricSurface('bowShock', jd, 8);
    const positions = geometry.getAttribute('position');
    expect(positions).toBeDefined();
    expect(positions.count).toBeGreaterThan(0);
  });
});
