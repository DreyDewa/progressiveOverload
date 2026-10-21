import { describe, expect, it } from 'vitest';
import { stampSets } from './sets';

const t1 = new Date('2024-01-01T10:00:00Z');
const t2 = new Date('2024-01-02T10:00:00Z');
const now = new Date('2024-01-03T10:00:00Z');

describe('stampSets', () => {
  it('keeps the time of unchanged sets and stamps new ones', () => {
    const out = stampSets([{ weight: 60, reps: 10, at: t1 }], [{ weight: 60, reps: 10 }, { weight: 60, reps: 8 }], now, t2);
    expect(out.map((s) => s.at)).toEqual([t1, now]);
  });
  it('stamps edited sets with now', () => {
    const out = stampSets([{ weight: 60, reps: 10, at: t1 }], [{ weight: 60, reps: 9 }], now, t2);
    expect(out[0].at).toBe(now);
  });
  it('matches sets after one in the middle is deleted', () => {
    const old = [
      { weight: 60, reps: 10, at: t1 },
      { weight: 60, reps: 9, at: t1 },
      { weight: 60, reps: 8, at: t2 },
    ];
    const out = stampSets(old, [{ weight: 60, reps: 10 }, { weight: 60, reps: 8 }], now, t1);
    expect(out.map((s) => s.at)).toEqual([t1, t2]);
  });
  it('uses each old set only once', () => {
    const out = stampSets([{ weight: 60, reps: 10, at: t1 }], [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }], now, t2);
    expect(out.map((s) => s.at)).toEqual([t1, now]);
  });
  it('falls back for old sets without a time', () => {
    const out = stampSets([{ weight: 60, reps: 10 }], [{ weight: 60, reps: 10 }], now, t2);
    expect(out[0].at).toBe(t2);
  });
});
