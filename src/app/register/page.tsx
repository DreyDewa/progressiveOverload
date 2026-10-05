'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, ErrorText, Input } from '@/components/ui';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: { username, password } });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Progressive Overload</h1>
        <p className="text-zinc-400 mb-4">Create account</p>
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <Input
              placeholder="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <ErrorText>{error}</ErrorText>
            <p className="text-sm text-zinc-400">
              There&apos;s no password reset. Keep your password somewhere safe.
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '…' : 'Create account'}
            </Button>
          </form>
        </Card>
        <p className="text-sm text-zinc-400 mt-4 text-center">
          Have an account?{' '}
          <Link href="/login" className="text-lime-400">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
