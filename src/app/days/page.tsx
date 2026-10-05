'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, ErrorText, PageHeader } from '@/components/ui';

type Day = { id: string; name: string; order: number; exerciseIds: string[] };

export default function DaysPage() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ days: Day[] }>('/api/days')
      .then((d) => setDays(d.days))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function move(index: number, delta: number) {
    if (!days) return;
    const next = [...days];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    const previous = days;
    setDays(next);
    setError('');
    try {
      const res = await api<{ days: Day[] }>('/api/days/reorder', {
        method: 'POST',
        body: { ids: next.map((d) => d.id) },
      });
      setDays(res.days);
    } catch (e) {
      setDays(previous);
      setError((e as Error).message);
    }
  }

  async function addDay() {
    setError('');
    try {
      const res = await api<{ day: Day }>('/api/days', { method: 'POST', body: {} });
      setDays((d) => [...(d ?? []), res.day]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-28">
      <PageHeader title="Your days" back="/settings" />
      <p className="text-zinc-400 mb-4">Your days run in a rotation. After you finish one, the next one is up.</p>
      <ErrorText>{error}</ErrorText>
      {!days && !error && <p className="text-zinc-400">Loading…</p>}
      {days && (
        <div className="space-y-2">
          {days.map((day, i) => (
            <Card key={day.id} className="flex items-center gap-2 !p-2">
              <Link href={`/days/${day.id}`} className="flex-1 min-h-11 flex flex-col justify-center px-2">
                <span className="font-medium">{day.name}</span>
                <span className="text-sm text-zinc-400 tabular-nums">
                  {day.exerciseIds.length} {day.exerciseIds.length === 1 ? 'exercise' : 'exercises'}
                </span>
              </Link>
              <Button
                variant="ghost"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="!px-3"
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                aria-label="Move down"
                disabled={i === days.length - 1}
                onClick={() => move(i, 1)}
                className="!px-3"
              >
                ↓
              </Button>
            </Card>
          ))}
          {days.length < 14 && (
            <Button variant="secondary" className="w-full" onClick={addDay}>
              Add day
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
