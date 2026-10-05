'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, ErrorText, Input, PageHeader } from '@/components/ui';

type Exercise = { id: string; name: string };
type Day = { id: string; name: string; order: number; exerciseIds: string[] };

export default function EditDayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [day, setDay] = useState<Day | null>(null);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [dayCount, setDayCount] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ day: Day; exercises: Exercise[] }>(`/api/days/${id}`),
      api<{ exercises: Exercise[] }>('/api/exercises'),
      api<{ days: Day[] }>('/api/days'),
    ])
      .then(([d, lib, days]) => {
        setDay(d.day);
        setName(d.day.name);
        setExercises(d.exercises);
        setLibrary(lib.exercises);
        setDayCount(days.days.length);
        setLoaded(true);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  async function saveName() {
    const trimmed = name.trim();
    if (!day || !trimmed || trimmed === day.name) {
      if (day && !trimmed) setName(day.name);
      return;
    }
    setError('');
    try {
      const res = await api<{ day: Day }>(`/api/days/${id}`, { method: 'PATCH', body: { name: trimmed } });
      setDay(res.day);
      setName(res.day.name);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveExercises(next: Exercise[]) {
    const previous = exercises;
    setExercises(next);
    setError('');
    try {
      await api(`/api/days/${id}`, { method: 'PATCH', body: { exerciseIds: next.map((e) => e.id) } });
    } catch (e) {
      setExercises(previous);
      setError((e as Error).message);
    }
  }

  function move(index: number, delta: number) {
    const next = [...exercises];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    saveExercises(next);
  }

  function addExisting(ex: Exercise) {
    setQuery('');
    saveExercises([...exercises, ex]);
  }

  async function createAndAdd(text: string) {
    setError('');
    try {
      const res = await api<{ exercise: Exercise }>('/api/exercises', { method: 'POST', body: { name: text } });
      const ex = res.exercise;
      setLibrary((lib) => (lib.some((l) => l.id === ex.id) ? lib : [...lib, ex]));
      setQuery('');
      if (!exercises.some((e) => e.id === ex.id)) await saveExercises([...exercises, ex]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteDay() {
    if (!window.confirm('Delete this day? Your logged workouts are kept.')) return;
    try {
      await api(`/api/days/${id}`, { method: 'DELETE' });
      router.push('/days');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const trimmedQuery = query.trim();
  const lower = trimmedQuery.toLowerCase();
  const inDay = new Set(exercises.map((e) => e.id));
  const matches = trimmedQuery
    ? library.filter((e) => !inDay.has(e.id) && e.name.toLowerCase().includes(lower)).slice(0, 8)
    : [];
  const exactExists = library.some((e) => e.name.toLowerCase() === lower);

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-28">
      <PageHeader title={day?.name ?? 'Edit day'} back="/days" />
      <ErrorText>{error}</ErrorText>
      {!loaded && !error && <p className="text-zinc-400">Loading…</p>}
      {loaded && (
        <div className="space-y-6">
          <section>
            <label className="block text-sm text-zinc-400 mb-1" htmlFor="day-name">
              Name
            </label>
            <Input
              id="day-name"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-zinc-400">Exercises</h2>
            {exercises.length === 0 && <p className="text-zinc-500">No exercises yet.</p>}
            {exercises.map((ex, i) => (
              <Card key={ex.id} className="flex items-center gap-1 !p-2">
                <span className="flex-1 px-2 font-medium">{ex.name}</span>
                <Button variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="!px-3">
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Move down"
                  disabled={i === exercises.length - 1}
                  onClick={() => move(i, 1)}
                  className="!px-3"
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Remove ${ex.name}`}
                  onClick={() => saveExercises(exercises.filter((e) => e.id !== ex.id))}
                  className="!px-3"
                >
                  ✕
                </Button>
              </Card>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-zinc-400">Add exercise</h2>
            <Input
              placeholder="Exercise name, e.g. Bench press"
              value={query}
              maxLength={60}
              onChange={(e) => setQuery(e.target.value)}
            />
            {matches.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExisting(ex)}
                className="w-full min-h-11 text-left px-3 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                {ex.name}
              </button>
            ))}
            {trimmedQuery && !exactExists && (
              <button
                onClick={() => createAndAdd(trimmedQuery)}
                className="w-full min-h-11 text-left px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-lime-400"
              >
                + Create &quot;{trimmedQuery}&quot;
              </button>
            )}
          </section>

          {dayCount > 1 && (
            <Button variant="danger" className="w-full" onClick={deleteDay}>
              Delete day
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
