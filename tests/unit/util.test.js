import { describe, it, expect } from 'vitest';
import { clamp, toHex, toRgbString, luminance, TOTAL_COLORS } from '../../src/js/util.js';

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
});
