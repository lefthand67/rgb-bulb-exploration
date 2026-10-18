import { describe, it, expect } from 'vitest';
import {
  DESKTOP,
  PORTRAIT,
  getLayoutMode,
  getLayoutConfig,
  isTouchDevice,
  shouldAnimateIntro,
} from '../../app/src/js/layout.js';

describe('layout mode', () => {
  it('uses portrait for a touch phone in portrait orientation', () => {
    expect(getLayoutMode(360, 800, true)).toBe('portrait');
    expect(getLayoutMode(412, 915, true)).toBe('portrait');
    expect(getLayoutMode(800, 1280, true)).toBe('portrait');
  });

  it('keeps landscape when the viewport is wider than tall', () => {
    expect(getLayoutMode(800, 360, true)).toBe('landscape');
    expect(getLayoutMode(640, 360, true)).toBe('landscape');
  });

  it('never gives a narrow desktop window the phone layout', () => {
    expect(getLayoutMode(360, 800, false)).toBe('landscape');
    expect(getLayoutMode(800, 1280, false)).toBe('landscape');
  });

  it('keeps tablet landscape and desktop landscape', () => {
    expect(getLayoutMode(1280, 800, true)).toBe('landscape');
    expect(getLayoutMode(1280, 720, false)).toBe('landscape');
    expect(getLayoutMode(1920, 1080, false)).toBe('landscape');
  });

  it('switches to landscape for a wide portrait-capable device', () => {
    expect(getLayoutMode(901, 1280, true)).toBe('landscape');
  });
});

describe('layout config', () => {
  it('exposes the desktop 1280x720 canvas', () => {
    expect(DESKTOP).toEqual({ name: 'landscape', width: 1280, height: 720, margin: 0.04 });
    expect(getLayoutConfig('landscape')).toBe(DESKTOP);
  });

  it('exposes the portrait 720x1280 canvas', () => {
    expect(PORTRAIT).toEqual({ name: 'portrait', width: 720, height: 1280, margin: 0.02 });
    expect(getLayoutConfig('portrait')).toBe(PORTRAIT);
  });
});

describe('isTouchDevice', () => {
  it('accepts maxTouchPoints > 0', () => {
    expect(isTouchDevice({ maxTouchPoints: 1, coarsePointer: false })).toBe(true);
  });

  it('accepts a coarse pointer', () => {
    expect(isTouchDevice({ maxTouchPoints: 0, coarsePointer: true })).toBe(true);
  });

  it('rejects a mouse-only desktop', () => {
    expect(isTouchDevice({ maxTouchPoints: 0, coarsePointer: false })).toBe(false);
  });
});


describe('shouldAnimateIntro', () => {
  it('animates the title bulb on a desktop pointer device', () => {
    expect(shouldAnimateIntro(false, false)).toBe(true);
  });

  it('never animates the title bulb on a touch device', () => {
    expect(shouldAnimateIntro(true, false)).toBe(false);
  });

  it('respects prefers-reduced-motion on desktop', () => {
    expect(shouldAnimateIntro(false, true)).toBe(false);
  });

  it('stays off for touch with reduced motion', () => {
    expect(shouldAnimateIntro(true, true)).toBe(false);
  });
});
