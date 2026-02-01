import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../db';
import { projects } from '../../../db/schema';
import { requireAuth } from '../../../lib/auth-guard';
import { generateId, generateSubdomain } from '../../../lib/id';

// GET /api/projects - List user's projects
export const GET = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const db = getDb(c.env.DB);

  const result = await db.select().from(projects).where(eq(projects.userId, session.userId!));

  return c.json({ projects: result });
});

// POST /api/projects - Create a new project
export const POST = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json<{ name: string }>();

  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Project name is required' }, 400);
  }

  const db = getDb(c.env.DB);
  const id = generateId();
  const subdomain = generateSubdomain();

  const project = {
    id,
    userId: session.userId!,
    name: body.name.trim(),
    subdomain,
    status: 'created' as const,
  };

  await db.insert(projects).values(project).run();

  return c.json({ project }, 201);
});
