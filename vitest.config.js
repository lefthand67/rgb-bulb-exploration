import { defineConfig } from 'vitest/config';

// Vite's project root is `app/` (see vite.config.js), but the test suite lives
// at the repository root in `tests/`. Pin Vitest to the repository root so it
// can find them independently of the Vite build root.
export default defineConfig({
  test: {
    root: process.cwd(),
    include: ['tests/**/*.test.js'],
    environment: 'node'
  }
});
