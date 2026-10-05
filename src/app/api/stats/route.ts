import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError } from '@/lib/http';
import { exerciseSeries, strengthSeries, type SessionLog } from '@/lib/stats';
import { Exercise } from '@/models/Exercise';
import { Session } from '@/models/Session';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const docs = await Session.find({ userId, finishedAt: { $ne: null } })
    .select('startedAt entries')
    .lean();
  const sessions: SessionLog[] = docs.map((s) => ({
    date: s.startedAt.toISOString(),
    entries: s.entries.map((e) => ({
      exerciseId: e.exerciseId.toString(),
      sets: e.sets.map((x) => ({ weight: x.weight, reps: x.reps })),
    })),
  }));
  const scoreSeries = strengthSeries(sessions);
  const byEx = exerciseSeries(sessions);
  const exDocs = await Exercise.find({ userId }).lean();
  const exercises = exDocs
    .filter((e) => byEx[e._id.toString()]?.length)
    .map((e) => ({ id: e._id.toString(), name: e.name, archived: e.archived, series: byEx[e._id.toString()] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return json({
    score: scoreSeries.length ? scoreSeries[scoreSeries.length - 1].score : null,
    scoreSeries,
    exercises,
  });
}
