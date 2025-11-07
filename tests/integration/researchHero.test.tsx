import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResearchGradeHero from '@/app/components/ResearchGradeHero';

const mockScene = {
  update: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  toggleComponent: vi.fn(),
  getVisibility: vi.fn(() => ({
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
  })),
  setTimeMode: vi.fn(),
  getCurrentDate: vi.fn(() => new Date())
};

vi.mock('@/app/lib/ResearchGradeHeliosphereScene', () => ({
  createResearchGradeScene: vi.fn(async () => mockScene)
}));

describe('ResearchGradeHero', () => {
  it('marks the canvas as ready after scene initialization', async () => {
    render(<ResearchGradeHero />);
    const canvas = await screen.findByTestId('research-scene-canvas');

    await waitFor(() =>
      expect(canvas).toHaveAttribute('data-scene-ready', 'true')
    );
  });
});
