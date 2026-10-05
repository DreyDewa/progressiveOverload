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

  const active = await Session.findOne({ userId, finishedAt: null });
  if (active) {
    if (active.dayId.toString() === dayId) return json({ id: active._id.toString() });
    if (active.entries.some((e) => e.sets.length > 0)) {
      active.finishedAt = new Date();
      await active.save();
    } else {
      await active.deleteOne();
    }
  }
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
