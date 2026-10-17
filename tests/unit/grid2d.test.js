import { describe, it, expect } from 'vitest';
import { cellFromPointer } from '../../app/src/js/grid2d.js';

// grid2d.js renders canvases (not available in the node test environment),
// so the click/hover mapping is tested as a pure function. The natural size
// of the grid canvas is 256 × 256 (one pixel per level).
describe('cellFromPointer (grid2d)', () => {
  const rect = { left: 100, top: 50, width: 512, height: 512 };

  it('maps the top-left corner to (0, 0)', () => {
    expect(cellFromPointer(rect, 100.4, 50.4)).toEqual({ r: 0, g: 0 });
  });

  it('maps the bottom-right corner beyond the edge to clamped (255, 255)', () => {
    expect(cellFromPointer(rect, 612, 562)).toEqual({ r: 255, g: 255 });
  });

  it('maps the middle to about half the range', () => {
    expect(cellFromPointer(rect, 356, 178)).toEqual({ r: 128, g: 64 });
  });

  it('ignores pointers outside the canvas', () => {
    expect(cellFromPointer(rect, 50, 60)).toBe(null);
    expect(cellFromPointer(rect, 620, 300)).toBe(null);
    expect(cellFromPointer(rect, 300, 30)).toBe(null);
    expect(cellFromPointer(rect, 300, 570)).toBe(null);
  });

  it('clamps coordinates to 0..255', () => {
    expect(cellFromPointer(rect, 612, 562).r).toBeLessThanOrEqual(255);
  });
});