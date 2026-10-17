import { describe, it, expect } from 'vitest';
import { sliceBlues, isoProjection, sheetLayers } from '../../app/src/js/cube.js';

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

  describe('sheetLayers', () => {
    it('collapses to exactly one sheet when blue is zero', () => {
      expect(sheetLayers(0)).toEqual([{ blue: 0, depth: 0 }]);
    });

    it('returns the full illustrative stack at blue 255', () => {
      const layers = sheetLayers(255, 6);
      expect(layers).toHaveLength(6);
      expect(layers[0]).toEqual({ blue: 0, depth: 1 });
      expect(layers.at(-1)).toEqual({ blue: 255, depth: 0 });
    });

    it('grows a partial stack at blue 128', () => {
      const layers = sheetLayers(128, 6);
      expect(layers.length).toBeGreaterThan(1);
      expect(layers.length).toBeLessThanOrEqual(6);
      expect(layers.every((l) => l.blue <= 128)).toBe(true);
      expect(layers.at(-1).blue).toBe(128);
      expect(layers.at(-1).depth).toBe(0);
      for (let i = 1; i < layers.length; i++) {
        expect(layers[i].depth).toBeLessThan(layers[i - 1].depth);
      }
    });

    it('returns a tiny but real stack at blue 1', () => {
      expect(sheetLayers(1, 6).map((l) => l.blue)).toEqual([0, 1]);
    });

    it('keeps every layer blue an integer in 0..255 and depth in 0..1', () => {
      for (const current of [0, 1, 64, 128, 200, 255]) {
        for (const layer of sheetLayers(current, 6)) {
          expect(Number.isInteger(layer.blue)).toBe(true);
          expect(layer.blue).toBeGreaterThanOrEqual(0);
          expect(layer.blue).toBeLessThanOrEqual(255);
          expect(layer.depth).toBeGreaterThanOrEqual(0);
          expect(layer.depth).toBeLessThanOrEqual(1);
        }
      }
    });

    it('never repeats a blue level', () => {
      const blues = sheetLayers(128, 6).map((l) => l.blue);
      expect(new Set(blues).size).toBe(blues.length);
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