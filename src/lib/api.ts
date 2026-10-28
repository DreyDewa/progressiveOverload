export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Something went wrong');
  return data as T;
}

/** Creates (or finds) an exercise by name and appends it to the day's exercises if it isn't there yet. */
export async function createExerciseForDay(dayId: string | null, dayExerciseIds: string[], name: string) {
  const { exercise } = await api<{ exercise: { id: string; name: string } }>('/api/exercises', {
    method: 'POST',
    body: { name },
  });
  if (dayId && !dayExerciseIds.includes(exercise.id)) {
    await api(`/api/days/${dayId}`, { method: 'PATCH', body: { exerciseIds: [...dayExerciseIds, exercise.id] } });
  }
  return exercise;
}
