'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatWeight, kgToUnit, type Unit } from '@/lib/units';
import { Card, ErrorText, PageHeader } from '@/components/ui';
import LineChart from '@/components/LineChart';

type Stats = {
  score: number | null;
  scoreSeries: { date: string; score: number }[];
  exercises: {
    id: string;
    name: string;
    archived: boolean;
    series: { date: string; e1rm: number; best: { weight: number; reps: number } }[];
  }[];
};

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [unit, setUnit] = useState<Unit>('kg');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api<Stats>('/api/stats'), api<{ unit: Unit }>('/api/me')])
      .then(([s, me]) => {
        setStats(s);
        setUnit(me.unit);
        setSelected(s.exercises[0]?.id ?? '');
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const exercise = stats?.exercises.find((e) => e.id === selected);
  const fmt = (v: number) => formatWeight(v, unit);

  return (
    <main className="max-w-md mx-auto px-4 pt-6 pb-28">
      <PageHeader title="Progress" />
      <ErrorText>{error}</ErrorText>
      {!stats && !error && <p className="text-zinc-400">Loading…</p>}
      {stats && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-zinc-400">Strength score</p>
            {stats.score === null ? (
              <p className="text-zinc-400 mt-1">Finish a workout to get your strength score.</p>
            ) : (
              <>
                <p className="text-5xl font-semibold tabular-nums mt-1">{stats.score}</p>
                <p className="text-sm text-zinc-400 mt-2">
                  100 = where you started. Based on your estimated 1-rep max for every exercise.
                </p>
              </>
            )}
            {stats.score !== null &&
              (stats.scoreSeries.length >= 2 ? (
                <div className="mt-4">
                  <LineChart
                    data={stats.scoreSeries.map((p) => ({ date: p.date, value: p.score }))}
                    valueLabel="Score"
                    formatValue={(v) => String(v)}
                  />
                </div>
              ) : (
                <p className="text-sm text-zinc-500 mt-4">Log at least two workouts to see a trend.</p>
              ))}
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Per exercise</h2>
            {stats.exercises.length === 0 ? (
              <p className="text-zinc-400">No workouts logged yet.</p>
            ) : (
              <>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full min-h-11 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-base focus:outline-none focus:border-lime-400"
                >
                  {stats.exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.archived ? ' (deleted)' : ''}
                    </option>
                  ))}
                </select>
                {exercise && (
                  <>
                    <Card>
                      {exercise.series.length >= 2 ? (
                        <LineChart
                          data={exercise.series.map((p) => ({ date: p.date, value: kgToUnit(p.e1rm, unit) }))}
                          valueLabel="Est. 1RM"
                          formatValue={(v) => `${Math.round(v * 100) / 100} ${unit}`}
                        />
                      ) : (
                        <p className="text-sm text-zinc-500">Log at least two workouts to see a trend.</p>
                      )}
                    </Card>
                    <div className="space-y-2">
                      {[...exercise.series].reverse().map((p) => (
                        <Card key={p.date} className="flex items-center justify-between py-3">
                          <span className="text-sm text-zinc-400">
                            {new Date(p.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="tabular-nums">
                            {fmt(p.best.weight)} × {p.best.reps}{' '}
                            <span className="text-sm text-zinc-500">e1RM {fmt(p.e1rm)}</span>
                          </span>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
