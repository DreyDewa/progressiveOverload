import { checkPassword, setSessionCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { json, jsonError, readJson } from '@/lib/http';
import { User } from '@/models/User';

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError('Invalid request', 400);
  const username = String(body.username ?? '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  await dbConnect();
  const user = await User.findOne({ username });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return jsonError('Invalid username or password', 401);
  }
  await setSessionCookie(user._id.toString());
  return json({ ok: true });
}
