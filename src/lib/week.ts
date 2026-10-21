export type WeekItem = { sessionId: string; dayName: string; exercise: string; at: string };
export type WeekDay = {
  date: Date;
  workouts: { sessionId: string; dayName: string; exercises: { name: string; sets: number }[] }[];
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Local midnight `days - 1` days before `today`, i.e. the start of a `days`-long window ending today. */
export function windowStart(today: Date, days = 7): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
}

/** One entry per calendar day (local time) in the window, oldest first. Rest days have no workouts. */
export function groupWeek(items: WeekItem[], today: Date, days = 7): WeekDay[] {
  const start = windowStart(today, days);
  const result: WeekDay[] = [];
  const byKey = new Map<string, WeekDay>();
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const day: WeekDay = { date, workouts: [] };
    result.push(day);
    byKey.set(dayKey(date), day);
  }
  for (const item of [...items].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())) {
    const day = byKey.get(dayKey(new Date(item.at)));
    if (!day) continue;
    let workout = day.workouts.find((w) => w.sessionId === item.sessionId);
    if (!workout) {
      workout = { sessionId: item.sessionId, dayName: item.dayName, exercises: [] };
      day.workouts.push(workout);
    }
    const ex = workout.exercises.find((e) => e.name === item.exercise);
    if (ex) ex.sets++;
    else workout.exercises.push({ name: item.exercise, sets: 1 });
  }
  return result;
}
