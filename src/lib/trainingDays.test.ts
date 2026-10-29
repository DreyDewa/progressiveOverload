import { describe, expect, it } from 'vitest';
import { localDate, trainingDays } from './trainingDays';

describe('trainingDays', () => {
  it('returns one entry per day with sets, oldest first', () => {
    const days = trainingDays(
      [
        new Date('2026-10-28T18:00:00Z'),
        new Date('2026-10-26T07:00:00Z'),
        new Date('2026-10-28T18:05:00Z'),
      ],
      'Europe/London',
    );
    expect(days).toEqual([
      { date: '2026-10-26', sets: 1 },
      { date: '2026-10-28', sets: 2 },
    ]);
  });
  it('uses the given time zone, not UTC', () => {
    // 23:30 UTC on 1 Jul is 00:30 on 2 Jul in London (BST).
    expect(localDate(new Date('2026-07-01T23:30:00Z'), 'Europe/London')).toBe('2026-07-02');
    // In winter London matches UTC.
    expect(localDate(new Date('2026-01-01T23:30:00Z'), 'Europe/London')).toBe('2026-01-01');
  });
  it('returns nothing when no sets were logged', () => {
    expect(trainingDays([], 'Europe/London')).toEqual([]);
  });
});
