import { describe, expect, it } from 'vitest';
import { groupWeek, windowStart } from './week';

// Local times, so the tests do not depend on the machine's time zone.
const today = new Date(2024, 0, 10, 15, 0);
const at = (day: number, hour = 18) => new Date(2024, 0, day, hour).toISOString();

describe('groupWeek', () => {
  it('returns 7 days ending today, oldest first', () => {
    const week = groupWeek([], today);
    expect(week).toHaveLength(7);
    expect(week[0].date).toEqual(new Date(2024, 0, 4));
    expect(week[6].date).toEqual(new Date(2024, 0, 10));
    expect(windowStart(today)).toEqual(new Date(2024, 0, 4));
  });
  it('splits a workout resumed the next day across both days', () => {
    const week = groupWeek(
      [
        { sessionId: 'a', dayName: 'Push', exercise: 'Bench', at: at(8) },
        { sessionId: 'a', dayName: 'Push', exercise: 'Bench', at: at(8) },
        { sessionId: 'a', dayName: 'Push', exercise: 'Bench', at: at(9) },
        { sessionId: 'b', dayName: 'Legs', exercise: 'Squat', at: at(9, 19) },
      ],
      today,
    );
    expect(week[4].workouts).toEqual([{ sessionId: 'a', dayName: 'Push', exercises: [{ name: 'Bench', sets: 2 }] }]);
    expect(week[5].workouts.map((w) => w.dayName)).toEqual(['Push', 'Legs']);
    expect(week[5].workouts[0].exercises).toEqual([{ name: 'Bench', sets: 1 }]);
    expect(week[6].workouts).toEqual([]);
  });
  it('ignores sets outside the window', () => {
    const week = groupWeek([{ sessionId: 'a', dayName: 'Push', exercise: 'Bench', at: at(1) }], today);
    expect(week.every((d) => d.workouts.length === 0)).toBe(true);
  });
});
