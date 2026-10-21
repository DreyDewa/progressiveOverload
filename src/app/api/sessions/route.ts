import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { Session } from '@/models/Session';
import { WorkoutDay } from '@/models/WorkoutDay';

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  const dayId = body?.dayId;
  if (typeof dayId !== 'string' || !mongoose.isValidObjectId(dayId)) return jsonError('Not found', 404);
  const day = await WorkoutDay.findOne({ _id: dayId, userId }).lean();
  if (!day) return jsonError('Not found', 404);

  // Several workouts can be open at once; they stay open until the user finishes them.
  const open = await Session.findOne({ userId, dayId, finishedAt: null }).sort({ startedAt: -1 }).lean();
  if (open) return json({ id: open._id.toString() });
  // Clean up open workouts that never got a set, so tapping a day by mistake leaves nothing behind.
  await Session.deleteMany({ userId, finishedAt: null, 'entries.0': { $exists: false } });
  const created = await Session.create({
    userId,
    dayId: day._id,
    dayName: day.name,
    startedAt: new Date(),
    finishedAt: null,
    entries: [],
  });
  return json({ id: created._id.toString() }, 201);
}
