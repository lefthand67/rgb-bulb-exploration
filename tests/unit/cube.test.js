import { describe, it, expect } from 'vitest';
import { sliceBlues, isoProjection } from '../../app/src/js/cube.js';

describe('cube helpers', () => {
  describe('sliceBlues', () => {
    it('picks representative blue values incl. both endpoints', () => {
      const blues = sliceBlues(5);
      expect(blues).toEqual([0, 64, 128, 191, 255]);
    });

    it('the last slice is always 255 and the first is 0', () => {
      expect(sliceBlues(4)[0]).toBe(0);
      expect(sliceBlues(4)[3]).toBe(255);
    });

    it('each blue differs from the previous', () => {
      const blues = sliceBlues(5);
      for (let i = 1; i < blues.length; i++) {
        expect(blues[i]).toBeGreaterThan(blues[i - 1]);
      }
    });
  });

  describe('isoProjection', () => {
    it('projects the cube axes without overlap', () => {
      // x-axis goes right/down, y-axis goes down, z (blue) goes up-right
      const a = isoProjection(0, 0, 0);
      const b = isoProjection(1, 0, 0);
      const c = isoProjection(0, 1, 0);
      const d = isoProjection(0, 0, 1);
      expect(b.x).toBeGreaterThan(a.x);
      expect(c.y).toBeGreaterThan(a.y);
      expect(d.y).toBeLessThan(a.y);
      expect(d.x).toBeGreaterThan(a.x);
    });
  });
});