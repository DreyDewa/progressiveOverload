import { getUserId } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { User } from '@/models/User';

const toMe = (user: { username: string; unit: string; showUpNext?: boolean | null }) => ({
  username: user.username,
  unit: user.unit,
  showUpNext: user.showUpNext ?? true,
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const user = await User.findById(userId).lean();
  if (!user) return jsonError('Unauthorized', 401);
  return json(toMe(user));
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return jsonError('Unauthorized', 401);
  await dbConnect();
  const body = await readJson(req);
  if (!body) return jsonError('Invalid body', 400);
  const update: { unit?: 'kg' | 'lb'; showUpNext?: boolean } = {};
  if ('unit' in body) {
    if (body.unit !== 'kg' && body.unit !== 'lb') return jsonError('Unit must be kg or lb', 400);
    update.unit = body.unit;
  }
  if ('showUpNext' in body) {
    if (typeof body.showUpNext !== 'boolean') return jsonError('showUpNext must be true or false', 400);
    update.showUpNext = body.showUpNext;
  }
  if (Object.keys(update).length === 0) return jsonError('Nothing to update', 400);
  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  if (!user) return jsonError('Unauthorized', 401);
  return json(toMe(user));
}
