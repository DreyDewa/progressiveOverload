export type Unit = 'kg' | 'lb';
export const KG_PER_LB = 0.45359237;

export const kgToUnit = (kg: number, unit: Unit) => (unit === 'kg' ? kg : kg / KG_PER_LB);
export const unitToKg = (value: number, unit: Unit) => (unit === 'kg' ? value : value * KG_PER_LB);

/** Rounds to at most 2 decimals and drops trailing zeros: 60 → "60", 61.235 → "61.24", 57.5 → "57.5" */
export function formatWeight(kg: number, unit: Unit): string {
  return String(Math.round(kgToUnit(kg, unit) * 100) / 100);
}

/** Parses user input like "60", "57,5", " 100.25 ". Returns null for empty/invalid/negative. */
export function parseWeight(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
