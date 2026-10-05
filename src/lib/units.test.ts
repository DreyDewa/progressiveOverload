import { describe, expect, it } from 'vitest';
import { formatWeight, parseWeight, unitToKg } from './units';

describe('units', () => {
  it('round trips lb', () => {
    expect(formatWeight(unitToKg(135, 'lb'), 'lb')).toBe('135');
  });
  it('formats kg', () => {
    expect(formatWeight(60, 'kg')).toBe('60');
  });
  it('parses weights', () => {
    expect(parseWeight('57,5')).toBe(57.5);
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('-5')).toBeNull();
    expect(parseWeight('abc')).toBeNull();
  });
});
