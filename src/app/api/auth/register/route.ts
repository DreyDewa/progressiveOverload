import { hashPassword, setSessionCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { User } from '@/models/User';
import { WorkoutDay } from '@/models/WorkoutDay';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError('Invalid request', 400);
  const username = String(body.username ?? '').trim().toLowerCase();
  const password = body.password;
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return jsonError('Username must be 3–24 characters: letters, numbers or _', 400);
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return jsonError('Password must be at least 8 characters', 400);
  }
  await dbConnect();
  if (await User.exists({ username })) return jsonError('That username is taken', 409);
  let user;
  try {
    user = await User.create({ username, passwordHash: await hashPassword(password) });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return jsonError('That username is taken', 409);
    throw e;
  }
  await WorkoutDay.insertMany(
    [0, 1, 2, 3].map((i) => ({ userId: user._id, name: `Day ${i + 1}`, order: i, exerciseIds: [] })),
  );
  await setSessionCookie(user._id.toString());
  return json({ ok: true }, 201);
}
