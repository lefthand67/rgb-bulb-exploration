import { describe, it, expect } from 'vitest';
import {
  isLightOn,
  nextSwitchValue
} from '../../app/src/js/lightswitch.js';

describe('lightswitch helpers', () => {
  describe('isLightOn', () => {
    it('is off when every channel is 0', () => {
      expect(isLightOn({ r: 0, g: 0, b: 0 })).toBe(false);
    });

    it('is on when all channels are at max', () => {
      expect(isLightOn({ r: 255, g: 255, b: 255 })).toBe(true);
    });

    it('is on when any single channel is non-zero', () => {
      expect(isLightOn({ r: 1, g: 0, b: 0 })).toBe(true);
      expect(isLightOn({ r: 0, g: 0, b: 128 })).toBe(true);
    });
  });

  describe('nextSwitchValue', () => {
    it('turns an off switch on', () => {
      expect(nextSwitchValue(0)).toBe(255);
    });

    it('turns a fully lit switch off', () => {
      expect(nextSwitchValue(255)).toBe(0);
    });

    it('turns any partially lit value off', () => {
      expect(nextSwitchValue(1)).toBe(0);
      expect(nextSwitchValue(127)).toBe(0);
    });

    it('round-trips between the two endpoints', () => {
      expect(nextSwitchValue(nextSwitchValue(0))).toBe(0);
      expect(nextSwitchValue(nextSwitchValue(255))).toBe(255);
    });
  });
});