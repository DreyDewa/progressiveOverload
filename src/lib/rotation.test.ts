import { describe, expect, it } from 'vitest';
import { upNextDayId } from './rotation';

const days = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('upNextDayId', () => {
  it('returns null for no days', () => expect(upNextDayId([], null)).toBeNull());
  it('returns the first day with no history', () => expect(upNextDayId(days, null)).toBe('a'));
  it('returns the day after the last trained', () => expect(upNextDayId(days, 'b')).toBe('c'));
  it('wraps around after the final day', () => expect(upNextDayId(days, 'c')).toBe('a'));
  it('returns the first day when the last id is not found', () => expect(upNextDayId(days, 'zzz')).toBe('a'));
});
