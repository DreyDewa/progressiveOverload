/** Estimated 1RM (Epley). Returns 0 if weight or reps are not positive. */
export function e1rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}
