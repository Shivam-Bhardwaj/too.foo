import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for main heliosphere visualization
 * Ensures consistent rendering across changes
 */

test.describe('Main Heliosphere Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set deterministic random seed for consistent rendering
    await page.addInitScript((seed: number) => {
      function mulberry32(a: number) {
        return () => {
          let t = (a += 0x6d2b79f5);
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }

      const seededRandom = mulberry32(seed);
      Math.random = seededRandom;
    }, 42);
  });

  test('renders default heliosphere view', async ({ page }) => {
    await page.goto('/');
    
    // Wait for canvas to be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Wait for WebGL scene initialization
    await page.waitForTimeout(2000); // Allow time for scene creation
    
    // Take screenshot for regression testing
    await expect(page).toHaveScreenshot('heliosphere-default.png', {
      maxDiffPixels: 200,
      timeout: 10000
    });
  });

  test('shows all planets with labels', async ({ page }) => {
    await page.goto('/');
    
    // Wait for scene
    await page.waitForTimeout(2000);
    
    // Check that layer control shows planets enabled
    const layersButton = page.locator('button', { hasText: 'Layers' });
    await layersButton.click();
    
    // Verify planets are enabled (button should be highlighted)
    await expect(page).toHaveScreenshot('heliosphere-with-layers.png', {
      maxDiffPixels: 200
    });
  });

  test('UV glow visible by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Open layers menu
    await page.locator('button', { hasText: 'Layers' }).click();
    
    // Verify "Helioglow (UV)" is enabled
    const helioglowButton = page.locator('button', { hasText: 'Helioglow (UV)' });
    await expect(helioglowButton).toHaveClass(/bg-white\/25/); // Active state
  });

  test('zoomed view shows planet details', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Simulate zoom in using wheel
    const canvas = page.locator('canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -1000); // Zoom in
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('heliosphere-zoomed.png', {
      maxDiffPixels: 200
    });
  });

  test('labels are tiny and readable', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check that labels exist and are small
    const labels = page.locator('.celestial-label');
    const count = await labels.count();
    
    // Should have labels for planets, voyagers, boundaries
    expect(count).toBeGreaterThan(5);
    
    // Check font size is small (4-8px range)
    if (count > 0) {
      const firstLabel = labels.first();
      const fontSize = await firstLabel.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizePx = parseInt(fontSize);
      expect(fontSizePx).toBeLessThan(10); // Should be tiny
    }
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('heliosphere-mobile.png', {
      maxDiffPixels: 200
    });
  });
});

