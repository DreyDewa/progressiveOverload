import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { cleanName } from '@/lib/validate';
import { Exercise } from '@/models/Exercise';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const docs = await Exercise.find({ userId, archived: false }).sort({ nameLower: 1 }).lean();
  return json({ exercises: docs.map((d) => ({ id: d._id.toString(), name: d.name })) });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  const name = cleanName(body?.name, 60);
  if (!name) return jsonError('Name must be 1–60 characters', 400);
  const nameLower = name.toLowerCase();

  const existing = await Exercise.findOne({ userId, nameLower });
  if (existing) {
    if (existing.archived) {
      existing.archived = false;
      existing.name = name;
      await existing.save();
    }
    return json({ exercise: { id: existing._id.toString(), name: existing.name } });
  }
  try {
    const created = await Exercise.create({ userId, name, nameLower, archived: false });
    return json({ exercise: { id: created._id.toString(), name: created.name } }, 201);
  } catch (e) {
    // Lost a race against a concurrent create of the same name: return the winner.
    if ((e as { code?: number }).code === 11000) {
      const winner = await Exercise.findOne({ userId, nameLower }).lean();
      if (winner) return json({ exercise: { id: winner._id.toString(), name: winner.name } });
    }
    throw e;
  }
}
