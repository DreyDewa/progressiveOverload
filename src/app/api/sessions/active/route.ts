import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError } from '@/lib/http';
import { Session } from '@/models/Session';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const s = await Session.findOne({ userId, finishedAt: null }).lean();
  if (!s) return json({ session: null });
  return json({
    session: { id: s._id.toString(), dayId: s.dayId.toString(), dayName: s.dayName, startedAt: s.startedAt.toISOString() },
  });
}
