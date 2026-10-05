import { describe, expect, it } from 'vitest';
import { bestE1rm, e1rm, exerciseSeries, strengthSeries, type SessionLog } from './stats';

const s = (date: string, entries: Record<string, [number, number][]>): SessionLog => ({
  date,
  entries: Object.entries(entries).map(([exerciseId, sets]) => ({
    exerciseId,
    sets: sets.map(([weight, reps]) => ({ weight, reps })),
  })),
});

describe('e1rm', () => {
  it('computes Epley', () => {
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 2);
    expect(e1rm(0, 10)).toBe(0);
    expect(e1rm(100, 0)).toBe(0);
  });
  it('bestE1rm picks the max and ignores zero-weight sets', () => {
    expect(bestE1rm([])).toBe(0);
    expect(bestE1rm([{ weight: 0, reps: 20 }])).toBe(0);
    expect(bestE1rm([{ weight: 100, reps: 1 }, { weight: 80, reps: 10 }, { weight: 0, reps: 50 }])).toBeCloseTo(106.67, 2);
  });
});

describe('strengthSeries', () => {
  it('is 100 for one session', () => {
    const r = strengthSeries([s('2026-01-01', { A: [[100, 10]] })]);
    expect(r).toEqual([{ date: '2026-01-01', score: 100 }]);
  });
  it('averages ratios across exercises', () => {
    const r = strengthSeries([
      s('2026-01-01', { A: [[100, 0.0001]], B: [[50, 10]] }),
      s('2026-01-08', { A: [[110, 0.0001]], B: [[50, 10]] }),
    ]);
    expect(r[1].score).toBe(105);
  });
  it('sorts sessions passed out of order', () => {
    const r = strengthSeries([
      s('2026-01-08', { A: [[110, 0.0001]] }),
      s('2026-01-01', { A: [[100, 0.0001]] }),
    ]);
    expect(r.map((p) => p.date)).toEqual(['2026-01-01', '2026-01-08']);
    expect(r[1].score).toBe(110);
  });
  it('skips sessions with only zero-weight sets', () => {
    const r = strengthSeries([s('2026-01-01', { A: [[0, 10]] }), s('2026-01-02', { A: [[100, 5]] })]);
    expect(r).toHaveLength(1);
    expect(r[0].date).toBe('2026-01-02');
  });
  it('counts a newly appearing exercise as 100% in its first session', () => {
    const r = strengthSeries([
      s('2026-01-01', { A: [[100, 0.0001]] }),
      s('2026-01-08', { A: [[120, 0.0001]], B: [[40, 5]] }),
    ]);
    expect(r[1].score).toBe(110);
  });
});

describe('exerciseSeries', () => {
  it('returns the set that produced the best e1rm', () => {
    const r = exerciseSeries([s('2026-01-01', { A: [[100, 1], [80, 10], [0, 30]] })]);
    expect(r.A).toHaveLength(1);
    expect(r.A[0].best).toEqual({ weight: 80, reps: 10 });
    expect(r.A[0].e1rm).toBeCloseTo(106.67, 2);
  });
});
