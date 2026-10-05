export type SetLog = { weight: number; reps: number }; // weight in kg
export type SessionLog = { date: string; entries: { exerciseId: string; sets: SetLog[] }[] };

/** Estimated 1RM (Epley). Returns 0 if weight or reps are not positive. */
export function e1rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

/** Highest estimated 1RM over the sets; 0 if none are valid. */
export function bestE1rm(sets: SetLog[]): number {
  let best = 0;
  for (const s of sets) best = Math.max(best, e1rm(s.weight, s.reps));
  return best;
}

const byDate = (a: SessionLog, b: SessionLog) => new Date(a.date).getTime() - new Date(b.date).getTime();

/** sessions in any order; returns one point per session that has any valid data, oldest first */
export function strengthSeries(sessions: SessionLog[]): { date: string; score: number }[] {
  const first = new Map<string, number>();
  const latest = new Map<string, number>();
  const points: { date: string; score: number }[] = [];
  for (const session of [...sessions].sort(byDate)) {
    let any = false;
    for (const entry of session.entries) {
      const best = bestE1rm(entry.sets);
      if (best <= 0) continue;
      any = true;
      if (!first.has(entry.exerciseId)) first.set(entry.exerciseId, best);
      latest.set(entry.exerciseId, best);
    }
    if (!any) continue;
    let sum = 0;
    for (const [id, f] of first) sum += latest.get(id)! / f;
    const score = Math.round((100 * sum) / first.size * 10) / 10;
    points.push({ date: session.date, score });
  }
  return points;
}

/** per exercise: one point per session where it had a valid best, oldest first */
export function exerciseSeries(
  sessions: SessionLog[],
): Record<string, { date: string; e1rm: number; best: SetLog }[]> {
  const result: Record<string, { date: string; e1rm: number; best: SetLog }[]> = {};
  for (const session of [...sessions].sort(byDate)) {
    for (const entry of session.entries) {
      let bestSet: SetLog | null = null;
      let best = 0;
      for (const s of entry.sets) {
        const v = e1rm(s.weight, s.reps);
        if (v > best) {
          best = v;
          bestSet = { weight: s.weight, reps: s.reps };
        }
      }
      if (!bestSet) continue;
      (result[entry.exerciseId] ??= []).push({ date: session.date, e1rm: best, best: bestSet });
    }
  }
  return result;
}
