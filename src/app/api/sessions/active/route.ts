import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError } from '@/lib/http';
import { Session } from '@/models/Session';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const docs = await Session.find({ userId, finishedAt: null }).sort({ startedAt: -1 }).lean();
  return json({
    sessions: docs.map((s) => ({
      id: s._id.toString(),
      dayId: s.dayId.toString(),
      dayName: s.dayName,
      startedAt: s.startedAt.toISOString(),
    })),
  });
}
