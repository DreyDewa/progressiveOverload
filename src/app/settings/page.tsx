'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Unit } from '@/lib/units';
import { Button, Card, ErrorText, PageHeader } from '@/components/ui';

const UNITS: Unit[] = ['kg', 'lb'];

export default function SettingsPage() {
  const [me, setMe] = useState<{ username: string; unit: Unit } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ username: string; unit: Unit }>('/api/me')
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function changeUnit(unit: Unit) {
    if (!me || me.unit === unit) return;
    const previous = me;
    setMe({ ...me, unit });
    setError('');
    try {
      setMe(await api<{ username: string; unit: Unit }>('/api/me', { method: 'PATCH', body: { unit } }));
    } catch (e) {
      setMe(previous);
      setError((e as Error).message);
    }
  }

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 pt-6 pb-28">
      <PageHeader title="Settings" />
      <ErrorText>{error}</ErrorText>
      {!me && !error && <p className="text-zinc-400">Loading…</p>}
      {me && (
        <div className="space-y-4">
          <Card>
            <p className="text-zinc-400">
              Logged in as <strong className="text-zinc-100">{me.username}</strong>
            </p>
          </Card>

          <Card>
            <p className="text-sm text-zinc-400 mb-3">Units</p>
            <div className="grid grid-cols-2 gap-2">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => changeUnit(u)}
                  aria-pressed={me.unit === u}
                  className={`min-h-11 rounded-xl font-medium ${
                    me.unit === u ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <p className="text-sm text-zinc-400 px-4 pt-4 pb-2">Workout setup</p>
            <Link href="/days" className="flex items-center justify-between min-h-11 px-4 border-t border-zinc-800">
              <span>Your days</span>
              <span className="text-zinc-500">›</span>
            </Link>
            <Link href="/exercises" className="flex items-center justify-between min-h-11 px-4 border-t border-zinc-800">
              <span>Your exercises</span>
              <span className="text-zinc-500">›</span>
            </Link>
          </Card>

          <Button variant="danger" className="w-full" onClick={logout}>
            Log out
          </Button>

          <p className="text-sm text-zinc-500 text-center">Progressive Overload is free and open source.</p>
        </div>
      )}
    </main>
  );
}
