import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { User } from '@/models/User';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const user = await User.findById(userId).lean();
  if (!user) return jsonError('Unauthorized', 401);
  return json({ username: user.username, unit: user.unit });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  if (!body || (body.unit !== 'kg' && body.unit !== 'lb')) return jsonError('Unit must be kg or lb', 400);
  const user = await User.findByIdAndUpdate(userId, { unit: body.unit }, { new: true }).lean();
  if (!user) return jsonError('Unauthorized', 401);
  return json({ username: user.username, unit: user.unit });
}
