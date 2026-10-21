import mongoose from 'mongoose';
import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { stampSets } from '@/lib/sets';
import { pickBest } from '@/lib/stats';
import { Exercise } from '@/models/Exercise';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import { WorkoutDay } from '@/models/WorkoutDay';

type Ctx = { params: Promise<{ id: string }> };
type SetLog = { weight: number; reps: number };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const session = await Session.findOne({ _id: id, userId }).lean();
  if (!session) return jsonError('Not found', 404);

  const user = await User.findById(userId).select('unit').lean();
  const day = await WorkoutDay.findOne({ _id: session.dayId, userId }).lean();

  const entries = session.entries.map((e) => ({
    exerciseId: e.exerciseId.toString(),
    sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
  }));

  const dayIds = (day?.exerciseIds ?? []).map(String);
  const entryIds = entries.map((e) => e.exerciseId);
  const allIds = [...new Set([...dayIds, ...entryIds])];
  const docs = await Exercise.find({ userId, _id: { $in: allIds } }).lean();
  const byId = new Map(docs.map((e) => [e._id.toString(), e]));
  const ordered: string[] = [];
  for (const eid of dayIds) {
    const e = byId.get(eid);
    if (e && !e.archived && !ordered.includes(eid)) ordered.push(eid);
  }
  for (const eid of entryIds) {
    if (byId.has(eid) && !ordered.includes(eid)) ordered.push(eid);
  }
  const exercises = ordered.map((eid) => ({ id: eid, name: byId.get(eid)!.name }));

  // Per exercise, the session (other than this one) with the strongest set: the one to beat.
  const best: Record<string, { date: string; sets: SetLog[] }> = {};
  if (ordered.length) {
    const past = await Session.find({ userId, _id: { $ne: id }, 'entries.exerciseId': { $in: ordered } })
      .select('startedAt entries')
      .lean();
    const candidates = new Map<string, { date: string; sets: SetLog[] }[]>();
    for (const p of past) {
      for (const e of p.entries) {
        const eid = e.exerciseId.toString();
        if (!ordered.includes(eid) || e.sets.length === 0) continue;
        // Date it by when the sets were logged, which differs from startedAt for a workout resumed later.
        const last = Math.max(...e.sets.map((s) => (s.at ?? p.startedAt).getTime()));
        const list = candidates.get(eid) ?? [];
        list.push({ date: new Date(last).toISOString(), sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps })) });
        candidates.set(eid, list);
      }
    }
    for (const [eid, list] of candidates) {
      const pick = pickBest(list);
      if (pick) best[eid] = pick;
    }
  }

  return json({
    session: {
      id: session._id.toString(),
      dayId: session.dayId.toString(),
      dayName: session.dayName,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
      entries,
    },
    unit: user?.unit ?? 'kg',
    exercises,
    best,
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const session = await Session.findOne({ _id: id, userId });
  if (!session) return jsonError('Not found', 404);
  if (session.finishedAt) return jsonError('This workout is already finished', 400);

  const body = await readJson(req);
  const raw = body?.entries;
  if (!Array.isArray(raw) || raw.length > 30) return jsonError('Invalid entries', 400);
  const cleaned: { exerciseId: string; sets: SetLog[] }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return jsonError('Invalid entries', 400);
    const { exerciseId, sets } = item as { exerciseId?: unknown; sets?: unknown };
    if (typeof exerciseId !== 'string' || !mongoose.isValidObjectId(exerciseId)) {
      return jsonError('Invalid entries', 400);
    }
    if (!Array.isArray(sets) || sets.length > 20) return jsonError('Invalid entries', 400);
    const cleanSets: SetLog[] = [];
    for (const s of sets) {
      const { weight, reps } = (s ?? {}) as { weight?: unknown; reps?: unknown };
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0 || weight > 2000) {
        return jsonError('Invalid weight', 400);
      }
      if (typeof reps !== 'number' || !Number.isInteger(reps) || reps < 0 || reps > 1000) {
        return jsonError('Invalid reps', 400);
      }
      cleanSets.push({ weight, reps });
    }
    if (cleanSets.length > 0) cleaned.push({ exerciseId, sets: cleanSets });
  }
  const now = new Date();
  const stamped = cleaned.map((e) => {
    const old = session.entries.find((o) => o.exerciseId.toString() === e.exerciseId);
    return { exerciseId: e.exerciseId, sets: stampSets(old?.sets ?? [], e.sets, now, session.startedAt) };
  });
  session.set('entries', stamped);
  await session.save();
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError('Not found', 404);
  const res = await Session.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) return jsonError('Not found', 404);
  return json({ ok: true });
}
