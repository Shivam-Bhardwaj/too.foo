## Testing Guide

This repository now supports three testing layers:

1. **Unit / Model checks** – fast, deterministic Vitest suites (`npm test`)
2. **Integration checks** – React component tests (mocked WebGL scene) that verify UI wiring
3. **Visual regression tests** – Playwright-powered screenshot comparisons for `/research`

### Prerequisites

```bash
npm install
npx playwright install chromium
# On Linux hosts you may also need system deps:
# npx playwright install-deps chromium
```

> _Without the system packages Playwright will refuse to launch headless Chromium._

### Unit & Integration

```bash
# Run once
npm test

# Watch mode during development
npm run test:watch
```

Vitest uses the `happy-dom` environment plus our `tests/setupTests.ts` polyfills so that components depending on `<canvas>` APIs can render.

### Visual Regression

```bash
# Run against existing baselines
npm run test:visual

# Update (or create) baselines after intentional UI changes
npm run test:visual:update
```

The visual suite will:

- Build the static site (`npm run build`)
- Serve the `out/` export on `http://127.0.0.1:4173`
- Launch headless Chromium
- Seed `Math.random` for deterministic star fields
- Capture the heliosphere canvas on `/research`

Baseline images live under `tests/visual/__screenshots__/`. Commit updated snapshots whenever the expected rendering changes. If you only want to verify locally, leave the snapshots untracked and run with `--update-snapshots`.

### Continuous Integration

A dedicated workflow (`.github/workflows/test-suite.yml`) runs automatically on `push`/`pull_request`:

1. **Unit & Integration job** – Ubuntu runner, executes `npm ci` + `npm test`.
2. **Visual job** – Self-hosted runner labeled `self-hosted, linux, visual-tests`, executes `npm run test:visual`.

To provision the visual runner:

```bash
npx playwright install --with-deps chromium   # once per machine (installs browser + apt deps)
# Register the runner with GitHub and add the custom label "visual-tests"
```

The workflow uploads Playwright reports (`playwright-report/`, `test-results/`) as artifacts, so reviewers can inspect diffs when snapshots fail.
