import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError } from '@/lib/http';
import { Session } from '@/models/Session';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const session = await Session.findOne({ _id: id, userId });
  if (!session) return jsonError('Not found', 404);
  if (!session.entries.some((e) => e.sets.length > 0)) {
    await session.deleteOne();
    return json({ ok: true, deleted: true });
  }
  if (!session.finishedAt) {
    session.finishedAt = new Date();
    await session.save();
  }
  return json({ ok: true, deleted: false });
}
