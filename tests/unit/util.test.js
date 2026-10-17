import { describe, it, expect } from 'vitest';
import {
  clamp,
  toHex,
  toRgbString,
  luminance,
  TOTAL_COLORS,
  shouldUseHash,
  dragValue
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
