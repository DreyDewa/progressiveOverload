import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { toDay } from '@/lib/days';
import { json, jsonError, readJson } from '@/lib/http';
import { cleanName } from '@/lib/validate';
import { Exercise } from '@/models/Exercise';
import { WorkoutDay } from '@/models/WorkoutDay';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const day = await WorkoutDay.findOne({ _id: id, userId }).lean();
  if (!day) return jsonError('Not found', 404);
  const docs = await Exercise.find({ userId, archived: false, _id: { $in: day.exerciseIds } }).lean();
  const byId = new Map(docs.map((e) => [e._id.toString(), e]));
  const exercises = day.exerciseIds
    .map((eid) => byId.get(eid.toString()))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map((e) => ({ id: e._id.toString(), name: e.name }));
  return json({ day: toDay(day), exercises });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const body = await readJson(req);
  if (!body) return jsonError('Invalid body', 400);
  const day = await WorkoutDay.findOne({ _id: id, userId });
  if (!day) return jsonError('Not found', 404);

  if ('name' in body) {
    const name = cleanName(body.name, 40);
    if (!name) return jsonError('Name must be 1–40 characters', 400);
    day.name = name;
  }
  if ('exerciseIds' in body) {
    const ids = body.exerciseIds;
    if (
      !Array.isArray(ids) ||
      ids.length > 30 ||
      !ids.every((i) => typeof i === 'string' && mongoose.isValidObjectId(i)) ||
      new Set(ids).size !== ids.length
    ) {
      return jsonError('Invalid exerciseIds', 400);
    }
    const count = await Exercise.countDocuments({ userId, archived: false, _id: { $in: ids } });
    if (count !== ids.length) return jsonError('Invalid exerciseIds', 400);
    day.set('exerciseIds', ids);
  }
  await day.save();
  return json({ day: toDay(day) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const day = await WorkoutDay.findOne({ _id: id, userId });
  if (!day) return jsonError('Not found', 404);
  if ((await WorkoutDay.countDocuments({ userId })) <= 1) return jsonError('You need at least one day', 400);
  await day.deleteOne();
  const rest = await WorkoutDay.find({ userId }).sort({ order: 1 }).select('_id').lean();
  if (rest.length) {
    await WorkoutDay.bulkWrite(
      rest.map((d, index) => ({ updateOne: { filter: { _id: d._id }, update: { $set: { order: index } } } })),
    );
  }
  return json({ ok: true });
}
