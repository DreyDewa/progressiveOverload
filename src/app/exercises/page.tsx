'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, ErrorText, Input, PageHeader } from '@/components/ui';

type Exercise = { id: string; name: string };

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    api<{ exercises: Exercise[] }>('/api/exercises')
      .then((d) => setExercises(d.exercises))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function save(id: string) {
    setEditError('');
    try {
      const res = await api<{ exercise: Exercise }>(`/api/exercises/${id}`, { method: 'PATCH', body: { name: draft } });
      setExercises((list) =>
        (list ?? [])
          .map((e) => (e.id === id ? res.exercise : e))
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
      );
      setEditingId(null);
    } catch (e) {
      setEditError((e as Error).message);
    }
  }

  async function remove(exercise: Exercise) {
    if (!window.confirm(`Delete "${exercise.name}"? It will be removed from your days, but your history is kept.`)) return;
    setError('');
    try {
      await api(`/api/exercises/${exercise.id}`, { method: 'DELETE' });
      setExercises((list) => (list ?? []).filter((e) => e.id !== exercise.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-28">
      <PageHeader title="Your exercises" back="/settings" />
      <ErrorText>{error}</ErrorText>
      {!exercises && !error && <p className="text-zinc-400">Loading…</p>}
      {exercises && exercises.length === 0 && (
        <p className="text-zinc-400">
          No exercises yet. Add them while editing a day.{' '}
          <Link href="/days" className="text-lime-400">
            Go to your days
          </Link>
        </p>
      )}
      {exercises && exercises.length > 0 && (
        <div className="space-y-2">
          {exercises.map((ex) =>
            editingId === ex.id ? (
              <Card key={ex.id} className="space-y-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                <ErrorText>{editError}</ErrorText>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => save(ex.id)}>
                    Save
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : (
              <Card key={ex.id} className="flex items-center gap-2 !p-2">
                <span className="flex-1 px-2 font-medium">{ex.name}</span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(ex.id);
                    setDraft(ex.name);
                    setEditError('');
                  }}
                >
                  Rename
                </Button>
                <Button variant="danger" onClick={() => remove(ex)}>
                  Delete
                </Button>
              </Card>
            ),
          )}
        </div>
      )}
    </main>
  );
}
