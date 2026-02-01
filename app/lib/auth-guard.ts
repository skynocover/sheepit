import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { getDb } from '../db';

const unauthorized = (c: Context) => {
  const isApi = c.req.path.startsWith('/api/');
  if (isApi) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return c.redirect('/');
};

export const requireAuth = async (c: Context, next: Next) => {
  const session = c.get('session');
  if (!session?.userId) {
    return unauthorized(c);
  }

  const db = getDb(c.env.DB);
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    c.set('session', { id: session.id });
    return unauthorized(c);
  }

  await next();
};
