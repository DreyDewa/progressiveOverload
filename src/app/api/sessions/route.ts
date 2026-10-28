import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { idList } from '@/lib/validate';
import { Exercise } from '@/models/Exercise';
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

  // The exercises picked for this workout. Optional: without it the workout shows the day's exercises.
  let exerciseIds: string[] = [];
  if (body && 'exerciseIds' in body) {
    const ids = idList(body.exerciseIds);
    if (!ids || ids.length === 0) return jsonError('Pick at least one exercise', 400);
    const count = await Exercise.countDocuments({ userId, archived: false, _id: { $in: ids } });
    if (count !== ids.length) return jsonError('Invalid exerciseIds', 400);
    exerciseIds = ids;
  }

  // Several workouts can be open at once; they stay open until the user finishes them.
  const open = await Session.findOne({ userId, dayId, finishedAt: null }).sort({ startedAt: -1 }).lean();
  if (open) {
    // Resuming with a fresh pick: keep what the workout already has and add the newly picked exercises.
    if (exerciseIds.length && open.exerciseIds?.length) {
      await Session.updateOne({ _id: open._id }, { $addToSet: { exerciseIds: { $each: exerciseIds } } });
    }
    return json({ id: open._id.toString() });
  }
  // Clean up open workouts that never got a set, so tapping a day by mistake leaves nothing behind.
  await Session.deleteMany({ userId, finishedAt: null, 'entries.0': { $exists: false } });
  const created = await Session.create({
    userId,
    dayId: day._id,
    dayName: day.name,
    startedAt: new Date(),
    finishedAt: null,
    exerciseIds,
    entries: [],
  });
  return json({ id: created._id.toString() }, 201);
}
