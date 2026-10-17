import { describe, it, expect } from 'vitest';
import {
  clamp,
  toHex,
  toRgbString,
  luminance,
  TOTAL_COLORS,
  shouldUseHash,
  dragValue,
  bulbBrightness,
  bulbState
} from '../../app/src/js/util.js';

describe('util.js', () => {
  it('clamps values correctly', () => {
    expect(clamp(100, 0, 255)).toBe(100);
    expect(clamp(-10, 0, 255)).toBe(0);
    expect(clamp(300, 0, 255)).toBe(255);
    expect(clamp(127.6, 0, 255)).toBe(128);
  });

  it('converts RGB to Hex', () => {
    expect(toHex(255, 128, 0)).toBe('#FF8000');
    expect(toHex(0, 0, 0)).toBe('#000000');
    expect(toHex(255, 255, 255)).toBe('#FFFFFF');
  });

  it('converts RGB to rgb string', () => {
    expect(toRgbString(255, 128, 0)).toBe('rgb(255, 128, 0)');
  });

  it('calculates luminance', () => {
    expect(luminance(255, 255, 255)).toBeCloseTo(255, 4);
    expect(luminance(0, 0, 0)).toBe(0);
  });

  it('has correct TOTAL_COLORS', () => {
    expect(TOTAL_COLORS).toBe(16777216);
  });

  describe('shouldUseHash', () => {
    it('disables hash URLs on the file:// protocol', () => {
      expect(shouldUseHash('file:')).toBe(false);
    });

    it('keeps hash URLs over http(s)', () => {
      expect(shouldUseHash('http:')).toBe(true);
      expect(shouldUseHash('https:')).toBe(true);
    });
  });

  describe('bulbBrightness', () => {
    it('is 0 when the bulb is off', () => {
      expect(bulbBrightness(0, 0, 0)).toBe(0);
    });

    it('is 1 for a fully lit channel, in any of the primaries', () => {
      expect(bulbBrightness(255, 0, 0)).toBe(1);
      expect(bulbBrightness(0, 0, 255)).toBe(1);
      expect(bulbBrightness(0, 255, 0)).toBe(1);
      expect(bulbBrightness(255, 255, 255)).toBe(1);
    });

    it('is monotonic in every channel', () => {
      expect(bulbBrightness(10, 0, 0)).toBeLessThanOrEqual(bulbBrightness(20, 0, 0));
      expect(bulbBrightness(0, 10, 0)).toBeLessThanOrEqual(bulbBrightness(0, 20, 0));
      expect(bulbBrightness(0, 0, 10)).toBeLessThanOrEqual(bulbBrightness(0, 0, 20));
    });

    it('never goes below 0', () => {
      expect(bulbBrightness(0, 0, 1)).toBeGreaterThan(0);
    });
  });

  describe('bulbState', () => {
    it('is off only when every channel is zero', () => {
      expect(bulbState(0, 0, 0)).toBe('off');
    });

    it('is on for a fully lit channel in any primary', () => {
      expect(bulbState(255, 255, 255)).toBe('on');
      expect(bulbState(255, 0, 0)).toBe('on');
      expect(bulbState(0, 255, 0)).toBe('on');
      expect(bulbState(0, 0, 255)).toBe('on');
    });

    it('is dim for a dark non-zero colour', () => {
      expect(bulbState(10, 20, 50)).toBe('dim');
      expect(bulbState(0, 0, 1)).toBe('dim');
    });

    it('never goes from on to dim when a channel gets brighter', () => {
      const rank = { off: 0, dim: 1, on: 2 };
      for (let v = 0; v < 255; v += 7) {
        expect(rank[bulbState(0, 0, v + 1)]).toBeGreaterThanOrEqual(rank[bulbState(0, 0, v)]);
      }
    });
  });

  describe('dragValue', () => {
    it('keeps the start value when the pointer does not move', () => {
      expect(dragValue(128, 100, 100, 200)).toBe(128);
    });

    it('increases the value when the pointer moves up', () => {
      // Moving up half the track height adds half of 255 (rounded).
      expect(dragValue(0, 200, 100, 200)).toBe(128);
    });

    it('decreases the value when the pointer moves down', () => {
      expect(dragValue(100, 200, 100, 200)).toBe(228);
      expect(dragValue(255, 100, 200, 100)).toBe(0);
    });

    it('clamps to the 0..255 range', () => {
      expect(dragValue(250, 100, 0, 200)).toBe(255);
      expect(dragValue(5, 100, 300, 200)).toBe(0);
    });
  });
});
