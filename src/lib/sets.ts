export type StampedSet = { weight: number; reps: number; at: Date };

/**
 * Gives each new set the time it was logged. A set that matches an unused old set (same weight and reps)
 * keeps that set's time; anything else is new or edited and gets `now`.
 */
export function stampSets(
  oldSets: { weight: number; reps: number; at?: Date | null }[],
  newSets: { weight: number; reps: number }[],
  now: Date,
  fallback: Date,
): StampedSet[] {
  const pool = [...oldSets];
  return newSets.map((s) => {
    const i = pool.findIndex((o) => o.weight === s.weight && o.reps === s.reps);
    if (i === -1) return { weight: s.weight, reps: s.reps, at: now };
    const [match] = pool.splice(i, 1);
    return { weight: s.weight, reps: s.reps, at: match.at ?? fallback };
  });
}
