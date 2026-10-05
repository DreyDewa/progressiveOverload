'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { e1rm } from '@/lib/stats';
import { formatWeight, parseWeight, unitToKg, type Unit } from '@/lib/units';
import { Button, Card, ErrorText, Input } from '@/components/ui';

type SetLog = { weight: number; reps: number };
type Row = { weight: string; reps: string };
type Rows = Record<string, Row[]>;
type SessionData = {
  session: {
    id: string;
    dayId: string;
    dayName: string;
    startedAt: string;
    finishedAt: string | null;
    entries: { exerciseId: string; sets: SetLog[] }[];
  };
  unit: Unit;
  exercises: { id: string; name: string }[];
  lastTime: Record<string, { date: string; sets: SetLog[] }>;
};
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const validReps = (s: string) => /^\d+$/.test(s) && parseInt(s, 10) > 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const [rows, setRows] = useState<Rows>({});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const latestRows = useRef<Rows>({});
  const unitRef = useRef<Unit>('kg');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const again = useRef(false);
  const focusKey = useRef<string | null>(null);

  useEffect(() => {
    api<SessionData>(`/api/sessions/${id}`)
      .then((d) => {
        const initial: Rows = {};
        for (const e of d.session.entries) {
          initial[e.exerciseId] = e.sets.map((s) => ({
            weight: formatWeight(s.weight, d.unit),
            reps: String(s.reps),
          }));
        }
        latestRows.current = initial;
        unitRef.current = d.unit;
        setRows(initial);
        setData(d);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // Focus a freshly added input after it has rendered.
  useEffect(() => {
    if (focusKey.current) {
      document.getElementById(focusKey.current)?.focus();
      focusKey.current = null;
    }
  }, [rows]);

  const buildPayload = () => {
    const unit = unitRef.current;
    const entries: { exerciseId: string; sets: SetLog[] }[] = [];
    for (const [exerciseId, list] of Object.entries(latestRows.current)) {
      const sets = list
        .filter((r) => validReps(r.reps))
        .map((r) => ({
          weight: unitToKg(parseWeight(r.weight) ?? 0, unit),
          reps: parseInt(r.reps, 10),
        }));
      if (sets.length) entries.push({ exerciseId, sets });
    }
    return entries;
  };

  // Saves latest rows. If a save is in flight, waits for it and saves again. Resolves true on success.
  const flush = useCallback((): Promise<boolean> => {
    if (inflight.current) {
      again.current = true;
      return inflight.current;
    }
    const run = (async () => {
      let ok = true;
      do {
        again.current = false;
        setStatus('saving');
        try {
          await api(`/api/sessions/${id}`, { method: 'PUT', body: { entries: buildPayload() } });
          ok = true;
          setStatus('saved');
        } catch {
          ok = false;
          setStatus('error');
          break;
        }
      } while (again.current);
      inflight.current = null;
      return ok;
    })();
    inflight.current = run;
    return run;
  }, [id]);

  const update = (next: Rows) => {
    latestRows.current = next;
    setRows(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void flush();
    }, 600);
  };

  const setField = (ex: string, i: number, field: keyof Row, value: string) => {
    const list = (latestRows.current[ex] ?? []).map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    update({ ...latestRows.current, [ex]: list });
  };

  const addSet = (ex: string) => {
    const list = latestRows.current[ex] ?? [];
    const weight = list.length ? list[list.length - 1].weight : '';
    focusKey.current = `${ex}-${list.length}-${weight ? 'reps' : 'weight'}`;
    update({ ...latestRows.current, [ex]: [...list, { weight, reps: '' }] });
  };

  const removeSet = (ex: string, i: number) => {
    update({ ...latestRows.current, [ex]: (latestRows.current[ex] ?? []).filter((_, idx) => idx !== i) });
  };

  async function finish() {
    setBusy(true);
    setError('');
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) await inflight.current;
    const ok = await flush();
    if (!ok) {
      setError('Could not save your sets. Check your connection and try again.');
      setBusy(false);
      return;
    }
    try {
      await api(`/api/sessions/${id}/finish`, { method: 'POST' });
      router.push('/');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function discard() {
    if (!window.confirm('Discard this workout? Nothing from today will be saved.')) return;
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    try {
      await api(`/api/sessions/${id}`, { method: 'DELETE' });
      router.push('/');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <main className="max-w-md mx-auto px-4 pt-4 pb-10">
        <Link href="/" className="inline-flex items-center min-h-11 text-sm text-zinc-400">
          ‹ Home
        </Link>
        {error ? <ErrorText>{error}</ErrorText> : <p className="text-zinc-400">Loading…</p>}
      </main>
    );
  }

  const { session, unit, exercises, lastTime } = data;
  const readOnly = !!session.finishedAt;

  const statusText =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Not saved, check connection' : '';

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-md mx-auto px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-h-14">
          <Link href="/" className="inline-flex items-center min-h-11 text-sm text-zinc-400">
            ‹ Home
          </Link>
          <span className="font-medium truncate max-w-[40vw]">{session.dayName}</span>
          <div className="text-right">
            {readOnly ? (
              <Link href="/" className="inline-flex items-center min-h-11 text-sm text-lime-400">
                Done
              </Link>
            ) : (
              <span className={`text-xs ${status === 'error' ? 'text-rose-400' : 'text-zinc-400'}`}>{statusText}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {exercises.length === 0 && (
          <p className="text-zinc-400">
            This day has no exercises.{' '}
            <Link href={`/days/${session.dayId}`} className="text-lime-400">
              Edit day
            </Link>
          </p>
        )}

        {exercises.map((ex) => {
          const last = lastTime[ex.id];
          const list = rows[ex.id] ?? [];
          return (
            <Card key={ex.id} className="space-y-3">
              <h2 className="text-lg font-medium">{ex.name}</h2>
              <p className="text-sm text-zinc-400 tabular-nums">
                {last ? (
                  <>
                    Last time ·{' '}
                    {new Date(last.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    <span className="block">
                      {last.sets.map((s, i) => (
                        <span key={i} className="mr-3 whitespace-nowrap">
                          {formatWeight(s.weight, unit)} × {s.reps}
                        </span>
                      ))}
                    </span>
                  </>
                ) : (
                  'First time, no previous data'
                )}
              </p>

              <div className="space-y-2">
                {list.map((row, i) => {
                  let indicator: { text: string; cls: string } | null = null;
                  const prev = last?.sets[i];
                  if (prev && validReps(row.reps)) {
                    const cur = round2(e1rm(unitToKg(parseWeight(row.weight) ?? 0, unit), parseInt(row.reps, 10)));
                    const old = round2(e1rm(prev.weight, prev.reps));
                    indicator =
                      cur > old
                        ? { text: '▲', cls: 'text-emerald-400' }
                        : cur < old
                          ? { text: '▼', cls: 'text-rose-400' }
                          : { text: '=', cls: 'text-zinc-500' };
                  }
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto_minmax(0,1fr)_1.25rem_2.75rem] items-center gap-2"
                    >
                      <span className="text-sm text-zinc-500 tabular-nums">{i + 1}</span>
                      <div className="relative">
                        <Input
                          id={`${ex.id}-${i}-weight`}
                          type="text"
                          inputMode="decimal"
                          aria-label={`Set ${i + 1} weight`}
                          value={row.weight}
                          disabled={readOnly}
                          onChange={(e) => setField(ex.id, i, 'weight', e.target.value)}
                          className="tabular-nums pr-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">
                          {unit}
                        </span>
                      </div>
                      <span className="text-zinc-500">×</span>
                      <Input
                        id={`${ex.id}-${i}-reps`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`Set ${i + 1} reps`}
                        value={row.reps}
                        disabled={readOnly}
                        onChange={(e) => setField(ex.id, i, 'reps', e.target.value)}
                        className="tabular-nums"
                      />
                      <span className={`text-center ${indicator?.cls ?? ''}`}>{indicator?.text}</span>
                      {readOnly ? (
                        <span />
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete set ${i + 1}`}
                          onClick={() => removeSet(ex.id, i)}
                          className="min-h-11 min-w-11 text-zinc-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!readOnly && (
                <Button variant="secondary" className="w-full" onClick={() => addSet(ex.id)}>
                  + Add set
                </Button>
              )}
            </Card>
          );
        })}

        <ErrorText>{error}</ErrorText>

        {!readOnly && (
          <div className="space-y-2 pt-2">
            <Button className="w-full" disabled={busy} onClick={finish}>
              Finish workout
            </Button>
            <Button variant="ghost" className="w-full text-rose-300!" disabled={busy} onClick={discard}>
              Discard workout
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
