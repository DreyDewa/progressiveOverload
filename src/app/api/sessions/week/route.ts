import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError } from '@/lib/http';
import { Exercise } from '@/models/Exercise';
import { Session } from '@/models/Session';

/** GET /api/sessions/week?since=ISO → one item per set logged since then (the client groups them by day). */
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const since = new Date(new URL(req.url).searchParams.get('since') ?? '');
  if (Number.isNaN(since.getTime())) return jsonError('Invalid date', 400);

  // A session touched since then can only hold sets logged since then if it was updated since then.
  const docs = await Session.find({ userId, updatedAt: { $gte: since } })
    .select('dayName startedAt entries')
    .lean();
  const ids = [...new Set(docs.flatMap((d) => d.entries.map((e) => e.exerciseId.toString())))];
  const exercises = await Exercise.find({ userId, _id: { $in: ids } }).select('name').lean();
  const names = new Map(exercises.map((e) => [e._id.toString(), e.name]));

  const items: { sessionId: string; dayName: string; exercise: string; at: string }[] = [];
  for (const d of docs) {
    for (const e of d.entries) {
      const name = names.get(e.exerciseId.toString());
      if (!name) continue;
      for (const s of e.sets) {
        const at = s.at ?? d.startedAt;
        if (at >= since) items.push({ sessionId: d._id.toString(), dayName: d.dayName, exercise: name, at: at.toISOString() });
      }
    }
  }
  return json({ items });
}
