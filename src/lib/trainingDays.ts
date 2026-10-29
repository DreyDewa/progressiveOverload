export type TrainingDay = { date: string; sets: number };

/** Calendar date (YYYY-MM-DD) of `at` in `timeZone`. */
export function localDate(at: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

/** One entry per local day that has at least one logged set, oldest first, with how many sets were logged. */
export function trainingDays(setTimes: Date[], timeZone: string): TrainingDay[] {
  const counts = new Map<string, number>();
  for (const at of setTimes) {
    const date = localDate(at, timeZone);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, sets]) => ({ date, sets }));
}
