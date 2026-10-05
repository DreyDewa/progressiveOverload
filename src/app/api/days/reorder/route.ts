import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { toDay } from '@/lib/days';
import { json, jsonError, readJson } from '@/lib/http';
import { WorkoutDay } from '@/models/WorkoutDay';

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  const ids = body?.ids;
  if (!Array.isArray(ids) || !ids.every((i) => typeof i === 'string')) return jsonError('ids must be an array', 400);
  const owned = await WorkoutDay.find({ userId }).select('_id').lean();
  const ownedIds = new Set(owned.map((d) => d._id.toString()));
  if (ids.length !== ownedIds.size || new Set(ids).size !== ids.length || !ids.every((i) => ownedIds.has(i))) {
    return jsonError('ids must contain exactly your day ids', 400);
  }
  await WorkoutDay.bulkWrite(
    (ids as string[]).map((id, index) => ({
      updateOne: { filter: { _id: id, userId }, update: { $set: { order: index } } },
    })),
  );
  const docs = await WorkoutDay.find({ userId }).sort({ order: 1 }).lean();
  return json({ days: docs.map(toDay) });
}
