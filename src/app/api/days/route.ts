import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { toDay } from '@/lib/days';
import { json, jsonError, readJson } from '@/lib/http';
import { upNextDayId } from '@/lib/rotation';
import { cleanName } from '@/lib/validate';
import { Session } from '@/models/Session';
import { WorkoutDay } from '@/models/WorkoutDay';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const docs = await WorkoutDay.find({ userId }).sort({ order: 1 }).lean();
  const days = docs.map(toDay);
  const last = await Session.findOne({ userId, finishedAt: { $ne: null } })
    .sort({ startedAt: -1 })
    .select('dayId')
    .lean();
  return json({ days, upNextDayId: upNextDayId(days, last?.dayId?.toString() ?? null) });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  const existing = await WorkoutDay.find({ userId }).select('order').lean();
  if (existing.length >= 14) return jsonError('You can have at most 14 days', 400);
  const name = cleanName(body?.name, 40) ?? `Day ${existing.length + 1}`;
  const order = existing.length ? Math.max(...existing.map((d) => d.order)) + 1 : 0;
  const day = await WorkoutDay.create({ userId, name, order, exerciseIds: [] });
  return json({ day: toDay(day) }, 201);
}
