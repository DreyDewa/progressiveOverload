'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { groupWeek, windowStart, type WeekDay, type WeekItem } from '@/lib/week';
import { Button, Card, ErrorText } from '@/components/ui';

type Day = { id: string; name: string; order: number; exerciseIds: string[] };
type Open = { id: string; dayId: string; dayName: string; startedAt: string };

const dateFmt: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const exLabel = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

export default function Home() {
  const router = useRouter();
  const [days, setDays] = useState<Day[] | null>(null);
  const [upNextId, setUpNextId] = useState<string | null>(null);
  const [open, setOpen] = useState<Open[]>([]);
  const [week, setWeek] = useState<WeekDay[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [showUpNext, setShowUpNext] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ days: Day[]; upNextDayId: string | null }>('/api/days')
      .then((d) => {
        setDays(d.days);
        setUpNextId(d.upNextDayId);
      })
      .catch((e: Error) => setError(e.message));
    api<{ showUpNext: boolean }>('/api/me')
      .then((d) => setShowUpNext(d.showUpNext))
      .catch(() => {});
    api<{ sessions: Open[] }>('/api/sessions/active')
      .then((d) => setOpen(d.sessions))
      .catch(() => {});
    const today = new Date();
    api<{ items: WeekItem[] }>(`/api/sessions/week?since=${encodeURIComponent(windowStart(today).toISOString())}`)
      .then((d) => setWeek(groupWeek(d.items, today)))
      .catch(() => {});
    api<{ score: number | null }>('/api/stats')
      .then((d) => setScore(d.score))
      .catch(() => setScore(null));
  }, []);

  const openFor = (dayId: string) => open.find((o) => o.dayId === dayId);

  // An open workout for the day resumes; otherwise pick today's exercises first.
  function start(day: Day) {
    const o = openFor(day.id);
    router.push(o ? `/workout/${o.id}` : `/days/${day.id}/start`);
  }

  const upNext = (showUpNext && days?.find((d) => d.id === upNextId)) || null;

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
          {open.map((o) => (
            <Card key={o.id} className="border-lime-400">
              <p className="text-sm text-zinc-400">
                Workout in progress · started {new Date(o.startedAt).toLocaleDateString(undefined, dateFmt)}
              </p>
              <p className="text-lg font-medium mb-3">{o.dayName}</p>
              <Link
                href={`/workout/${o.id}`}
                className="flex items-center justify-center min-h-11 rounded-xl px-4 font-medium bg-lime-400 text-zinc-950"
              >
                Resume
              </Link>
            </Card>
          ))}

          {upNext && (
            <Card className="border-lime-400/40">
              <p className="text-sm text-zinc-400">Up next</p>
              <p className="text-2xl font-semibold">{upNext.name}</p>
              <p className="text-sm text-zinc-400 mb-4">{exLabel(upNext.exerciseIds.length)}</p>
              <Button className="w-full" onClick={() => start(upNext)}>
                {openFor(upNext.id) ? 'Resume' : 'Start'}
              </Button>
            </Card>
          )}

          {week && (
            <div>
              <p className="text-sm text-zinc-400 mb-2">Last 7 days</p>
              <Card className="divide-y divide-zinc-800 py-1">
                {week.map((d) => (
                  <div key={d.date.toISOString()} className="flex gap-3 py-2">
                    <span className="w-20 shrink-0 text-sm text-zinc-400 tabular-nums">
                      {d.date.toLocaleDateString(undefined, dateFmt)}
                    </span>
                    {d.workouts.length === 0 ? (
                      <span className="text-sm text-zinc-500">Rest</span>
                    ) : (
                      <div className="min-w-0 space-y-1">
                        {d.workouts.map((w) => (
                          <Link key={w.sessionId} href={`/workout/${w.sessionId}`} className="block">
                            <span className="block text-sm font-medium">{w.dayName}</span>
                            <span className="block text-sm text-zinc-400">
                              {w.exercises.map((e) => e.name).join(' · ')}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          )}

          <div>
            <p className="text-sm text-zinc-400 mb-2">All days</p>
            <div className="space-y-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  onClick={() => start(d)}
                  className="w-full min-h-11 text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <span>
                    <span className="block font-medium">{d.name}</span>
                    <span className="block text-sm text-zinc-400">{exLabel(d.exerciseIds.length)}</span>
                  </span>
                  {openFor(d.id) ? (
                    <span className="text-xs rounded-full bg-lime-400/15 text-lime-400 px-2 py-1">In progress</span>
                  ) : (
                    d.id === upNext?.id && (
                      <span className="text-xs rounded-full bg-lime-400/15 text-lime-400 px-2 py-1">Up next</span>
                    )
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
