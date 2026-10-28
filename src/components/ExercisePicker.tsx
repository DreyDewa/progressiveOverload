'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

type Exercise = { id: string; name: string };

/** Tick-list of exercises plus a field to add a new one. Used to pick a workout's exercises. */
export function ExercisePicker({
  options,
  selected,
  onToggle,
  onCreate,
}: {
  options: Exercise[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreate(trimmed);
      setName('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {options.map((ex) => {
        const on = selected.has(ex.id);
        return (
          <button
            key={ex.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onToggle(ex.id)}
            className={`w-full min-h-11 flex items-center gap-3 text-left px-3 rounded-xl border ${
              on ? 'bg-lime-400/10 border-lime-400' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <span
              className={`flex items-center justify-center size-5 shrink-0 rounded-md border text-xs ${
                on ? 'bg-lime-400 border-lime-400 text-zinc-950' : 'border-zinc-600'
              }`}
            >
              {on ? '✓' : ''}
            </span>
            <span className="font-medium">{ex.name}</span>
          </button>
        );
      })}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <Input
          placeholder="New exercise, e.g. Lunges"
          aria-label="New exercise name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={busy || !name.trim()} className="shrink-0">
          Add
        </Button>
      </form>
    </div>
  );
}
