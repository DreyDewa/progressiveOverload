'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, ErrorText } from '@/components/ui';

type Day = { id: string; name: string; order: number; exerciseIds: string[] };
type Active = { id: string; dayId: string; dayName: string; startedAt: string } | null;

const exLabel = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

export default function Home() {
  const router = useRouter();
  const [days, setDays] = useState<Day[] | null>(null);
  const [upNextId, setUpNextId] = useState<string | null>(null);
  const [active, setActive] = useState<Active>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ days: Day[]; upNextDayId: string | null }>('/api/days')
      .then((d) => {
        setDays(d.days);
        setUpNextId(d.upNextDayId);
      })
      .catch((e: Error) => setError(e.message));
    api<{ session: Active }>('/api/sessions/active')
      .then((d) => setActive(d.session))
      .catch(() => {});
    api<{ score: number | null }>('/api/stats')
      .then((d) => setScore(d.score))
      .catch(() => setScore(null));
  }, []);

  async function start(day: Day) {
    if (busy) return;
    if (day.exerciseIds.length === 0) {
      router.push(`/days/${day.id}`);
      return;
    }
    if (active && active.dayId !== day.id) {
      // Only warn when the other workout has logged sets.
      let hasSets = true;
      try {
        const s = await api<{ session: { entries: { sets: unknown[] }[] } }>(`/api/sessions/${active.id}`);
        hasSets = s.session.entries.some((e) => e.sets.length > 0);
      } catch {}
      if (
        hasSets &&
        !window.confirm(`You have a workout in progress for ${active.dayName}. Finish it and start ${day.name}?`)
      ) {
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      const { id } = await api<{ id: string }>('/api/sessions', { method: 'POST', body: { dayId: day.id } });
      router.push(`/workout/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const upNext = days?.find((d) => d.id === upNextId) ?? null;

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-28">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Overload</h1>
        <Link
          href="/progress"
          className="inline-flex items-center min-h-11 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-sm tabular-nums"
        >
          Strength {score === null ? '—' : Math.round(score)}
        </Link>
      </header>

      <ErrorText>{error}</ErrorText>
      {!days && !error && <p className="text-zinc-400">Loading…</p>}

      {days && (
        <div className="space-y-4">
          {active && (
            <Card className="border-lime-400">
              <p className="text-sm text-zinc-400">Workout in progress</p>
              <p className="text-lg font-medium mb-3">{active.dayName}</p>
              <Link
                href={`/workout/${active.id}`}
                className="flex items-center justify-center min-h-11 rounded-xl px-4 font-medium bg-lime-400 text-zinc-950"
              >
                Resume
              </Link>
            </Card>
          )}

          {upNext && (
            <Card className="border-lime-400/40">
              <p className="text-sm text-zinc-400">Up next</p>
              <p className="text-2xl font-semibold">{upNext.name}</p>
              <p className="text-sm text-zinc-400 mb-4">{exLabel(upNext.exerciseIds.length)}</p>
              <Button className="w-full" disabled={busy} onClick={() => start(upNext)}>
                Start
              </Button>
            </Card>
          )}

          <div>
            <p className="text-sm text-zinc-400 mb-2">All days</p>
            <div className="space-y-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  disabled={busy}
                  onClick={() => start(d)}
                  className="w-full min-h-11 text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <span>
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-sm text-zinc-400">{exLabel(d.exerciseIds.length)}</span>
                  </span>
                  {d.id === upNextId && (
                    <span className="text-xs rounded-full bg-lime-400/15 text-lime-400 px-2 py-1">Up next</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Link href="/days" className="inline-flex items-center min-h-11 text-sm text-zinc-400">
            Edit days
          </Link>
        </div>
      )}
    </main>
  );
}
