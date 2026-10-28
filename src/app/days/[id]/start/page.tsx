'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, createExerciseForDay } from '@/lib/api';
import { ExercisePicker } from '@/components/ExercisePicker';
import { Button, ErrorText, PageHeader } from '@/components/ui';

type Exercise = { id: string; name: string };
type Day = { id: string; name: string };

export default function StartDayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [day, setDay] = useState<Day | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ day: Day; exercises: Exercise[] }>(`/api/days/${id}`)
      .then((d) => {
        setDay(d.day);
        setExercises(d.exercises);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  function toggle(exId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  }

  async function create(name: string) {
    setError('');
    try {
      const ex = await createExerciseForDay(
        id,
        exercises.map((e) => e.id),
        name,
      );
      setExercises((list) => (list.some((e) => e.id === ex.id) ? list : [...list, ex]));
      setSelected((prev) => new Set(prev).add(ex.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      // Keep the day's order for the picked exercises.
      const exerciseIds = exercises.filter((e) => selected.has(e.id)).map((e) => e.id);
      const res = await api<{ id: string }>('/api/sessions', { method: 'POST', body: { dayId: id, exerciseIds } });
      router.push(`/workout/${res.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const count = selected.size;

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-28">
      <PageHeader title={day?.name ?? 'Start workout'} back="/" />
      {!day && !error && <p className="text-zinc-400">Loading…</p>}
      {day && (
        <div className="space-y-4">
          <p className="text-zinc-400">Which exercises are you doing today?</p>
          {exercises.length === 0 && <p className="text-zinc-500">This day has no exercises yet. Add one below.</p>}
          <ExercisePicker options={exercises} selected={selected} onToggle={toggle} onCreate={create} />
          <ErrorText>{error}</ErrorText>
          <div className="space-y-2 pt-2">
            <Button className="w-full" disabled={busy || count === 0} onClick={start}>
              {count === 0 ? 'Pick at least one exercise' : `Start · ${count} ${count === 1 ? 'exercise' : 'exercises'}`}
            </Button>
            <Link
              href={`/days/${id}?from=start`}
              className="flex items-center justify-center min-h-11 rounded-xl px-4 font-medium bg-zinc-800 text-zinc-100"
            >
              Edit day
            </Link>
          </div>
        </div>
      )}
      {!day && <ErrorText>{error}</ErrorText>}
    </main>
  );
}
