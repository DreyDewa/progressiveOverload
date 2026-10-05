/** days must be sorted by order. Returns the id of the day after the last trained one, wrapping around. */
export function upNextDayId(days: { id: string }[], lastTrainedDayId: string | null): string | null {
  if (days.length === 0) return null;
  const idx = lastTrainedDayId ? days.findIndex((d) => d.id === lastTrainedDayId) : -1;
  if (idx === -1) return days[0].id;
  return days[(idx + 1) % days.length].id;
}
