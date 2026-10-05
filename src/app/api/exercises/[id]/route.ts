import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { cleanName } from '@/lib/validate';
import { Exercise } from '@/models/Exercise';
import { WorkoutDay } from '@/models/WorkoutDay';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const body = await readJson(req);
  const name = cleanName(body?.name, 60);
  if (!name) return jsonError('Name must be 1–60 characters', 400);
  const nameLower = name.toLowerCase();

  const exercise = await Exercise.findOne({ _id: id, userId, archived: false });
  if (!exercise) return jsonError('Not found', 404);
  const clash = await Exercise.exists({ userId, nameLower, _id: { $ne: exercise._id } });
  if (clash) return jsonError('You already have an exercise with that name', 409);
  exercise.name = name;
  exercise.nameLower = nameLower;
  await exercise.save();
  return json({ exercise: { id: exercise._id.toString(), name: exercise.name } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const exercise = await Exercise.findOne({ _id: id, userId });
  if (!exercise) return jsonError('Not found', 404);
  exercise.archived = true;
  await exercise.save();
  await WorkoutDay.updateMany({ userId }, { $pull: { exerciseIds: exercise._id } });
  return json({ ok: true });
}
