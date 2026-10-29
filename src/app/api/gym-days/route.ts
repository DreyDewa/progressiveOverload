import { timingSafeEqual } from 'node:crypto';
import { dbConnect } from '@/lib/db';
import { jsonError } from '@/lib/http';
import { trainingDays } from '@/lib/trainingDays';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function sameKey(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/gym-days?key=SECRET[&days=14] → the days one user logged sets on, for scripts and automations.
 * Read only. Off unless GYM_FEED_KEY and GYM_FEED_USERNAME are set. Returns dates and set counts only.
 */
export async function GET(req: Request) {
  const expected = process.env.GYM_FEED_KEY;
  const username = process.env.GYM_FEED_USERNAME;
  if (!expected || !username) return jsonError('Not found', 404);

  const url = new URL(req.url);
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const given = url.searchParams.get('key') ?? bearer ?? '';
  if (!sameKey(given, expected)) return jsonError('Unauthorized', 401);

  const requested = Number(url.searchParams.get('days') ?? 14);
  const days = Number.isFinite(requested) ? Math.min(Math.max(Math.round(requested), 1), 60) : 14;
  const timeZone = process.env.GYM_FEED_TIMEZONE || 'Europe/London';
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  await dbConnect();
  const user = await User.findOne({ username: username.trim().toLowerCase() }).select('_id').lean();
  if (!user) return jsonError('Not found', 404);

  // A session can only hold sets logged since then if it was updated since then.
  const docs = await Session.find({ userId: user._id, updatedAt: { $gte: since } })
    .select('startedAt entries')
    .lean();
  const times: Date[] = [];
  for (const d of docs) {
    for (const e of d.entries) {
      for (const s of e.sets) {
        const at = s.at ?? d.startedAt;
        if (at >= since) times.push(at);
      }
    }
  }

  return NextResponse.json(
    { timeZone, since: since.toISOString(), days: trainingDays(times, timeZone) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
