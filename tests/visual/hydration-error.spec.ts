/**
 * Hydration Error Detection Test
 * 
 * This test actually runs the app in a browser and checks for React hydration errors
 * in the console. This catches issues that unit tests miss because they don't simulate
 * the actual Next.js SSR → hydration flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Hydration Error Detection', () => {
  test('should not have React hydration errors on /research page', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console errors and warnings
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Navigate to the research page
    await page.goto('/research', { waitUntil: 'networkidle' });

    // Wait for React to hydrate
    await page.waitForTimeout(2000);

    // Check for hydration errors
    const hydrationErrors = [
      ...consoleErrors,
      ...consoleWarnings,
    ].filter(msg => 
      msg.includes('hydration') ||
      msg.includes('Hydration') ||
      msg.includes('425') ||
      msg.includes('418') ||
      msg.includes('423') ||
      msg.includes('did not match') ||
      msg.includes('server-rendered HTML') ||
      msg.includes('Minified React error')
    );

    if (hydrationErrors.length > 0) {
      console.error('Hydration errors detected:', hydrationErrors);
      console.error('All console errors:', consoleErrors);
      console.error('All console warnings:', consoleWarnings);
    }

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should not have React hydration errors on /heliosphere-demo page', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    await page.goto('/heliosphere-demo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hydrationErrors = [
      ...consoleErrors,
      ...consoleWarnings,
    ].filter(msg => 
      msg.includes('hydration') ||
      msg.includes('Hydration') ||
      msg.includes('425') ||
      msg.includes('418') ||
      msg.includes('423') ||
      msg.includes('did not match') ||
      msg.includes('server-rendered HTML') ||
      msg.includes('Minified React error')
    );

    if (hydrationErrors.length > 0) {
      console.error('Hydration errors detected:', hydrationErrors);
    }

    expect(hydrationErrors).toHaveLength(0);
  });
});

