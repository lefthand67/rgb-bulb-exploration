import { describe, it, expect } from 'vitest';
import {
  TARGETS,
  TOLERANCE,
  isColorMatch,
  hintFor
} from '../../app/src/js/challenge-data.js';

describe('challenge data', () => {
  it('offers at least 15 distinct colours', () => {
    expect(TARGETS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(TARGETS.map((t) => t.name)).size).toBe(TARGETS.length);
  });

  it('starts with the familiar Sun target', () => {
    expect(TARGETS[0].name).toContain('Солнце');
  });

  it('keeps every target a valid 0..255 integer colour with a name', () => {
    for (const t of TARGETS) {
      expect(typeof t.name).toBe('string');
      expect(t.name.length).toBeGreaterThan(0);
      for (const channel of ['r', 'g', 'b']) {
        expect(Number.isInteger(t[channel])).toBe(true);
        expect(t[channel]).toBeGreaterThanOrEqual(0);
        expect(t[channel]).toBeLessThanOrEqual(255);
      }
    }
  });

  it('keeps every pair of tolerance boxes disjoint', () => {
    for (let i = 0; i < TARGETS.length; i++) {
      for (let j = i + 1; j < TARGETS.length; j++) {
        const a = TARGETS[i];
        const b = TARGETS[j];
        const furthest = Math.max(
          Math.abs(a.r - b.r),
          Math.abs(a.g - b.g),
          Math.abs(a.b - b.b)
        );
        expect(furthest, `${a.name} vs ${b.name}`).toBeGreaterThan(2 * TOLERANCE);
      }
    }
  });

  it('matches at most one target from the midpoint of any pair', () => {
    for (let i = 0; i < TARGETS.length; i++) {
      for (let j = i + 1; j < TARGETS.length; j++) {
        const a = TARGETS[i];
        const b = TARGETS[j];
        const mid = {
          r: Math.round((a.r + b.r) / 2),
          g: Math.round((a.g + b.g) / 2),
          b: Math.round((a.b + b.b) / 2)
        };
        const matches = TARGETS.filter((t) => isColorMatch(mid, t));
        expect(matches.length, `${a.name} vs ${b.name}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('matches the Sun colour exactly', () => {
    expect(isColorMatch({ r: 255, g: 220, b: 0 }, TARGETS[0])).toBe(true);
  });

  it('includes the tolerance boundary and excludes one step beyond', () => {
    const target = { r: 100, g: 100, b: 100 };
    expect(isColorMatch({ r: 124, g: 100, b: 100 }, target)).toBe(true);
    expect(isColorMatch({ r: 125, g: 100, b: 100 }, target)).toBe(false);
  });

  it('hints which channel to add or reduce', () => {
    const target = { r: 200, g: 100, b: 50 };
    expect(hintFor({ r: 0, g: 100, b: 50 }, target)).toContain('Добавь красного');
    expect(hintFor({ r: 255, g: 100, b: 50 }, target)).toContain('Убавь красный');
    expect(hintFor({ r: 200, g: 0, b: 50 }, target)).toContain('Добавь зелёного');
    expect(hintFor({ r: 200, g: 255, b: 50 }, target)).toContain('Убавь зелёный');
    expect(hintFor({ r: 200, g: 100, b: 0 }, target)).toContain('Добавь синего');
    expect(hintFor({ r: 200, g: 100, b: 255 }, target)).toContain('Убавь синий');
  });
});
