import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { projects, deployments } from '../../../../db/schema';
import { requireAuth } from '../../../../lib/auth-guard';
import { getProjectByIdAndUser } from '../../../../lib/project-helpers';

// PATCH /api/projects/:id - Update project description / isPublic
export const PATCH = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('id');
  const db = getDb(c.env.DB);

  const project = await getProjectByIdAndUser(db, projectId, session.userId!);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const body = await c.req.json<{ description?: string; isPublic?: boolean }>();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.description === 'string') {
    updates.description = body.description;
  }
  if (typeof body.isPublic === 'boolean') {
    updates.isPublic = body.isPublic;
  }

  await db.update(projects).set(updates).where(eq(projects.id, projectId)).run();

  return c.json({ ok: true });
});

// DELETE /api/projects/:id - Delete a project and its deployments
export const DELETE = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('id');
  const db = getDb(c.env.DB);

  const project = await getProjectByIdAndUser(db, projectId, session.userId!);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Delete deployments first (foreign key)
  await db.delete(deployments).where(eq(deployments.projectId, projectId)).run();
  // Delete project
  await db.delete(projects).where(eq(projects.id, projectId)).run();

  return c.json({ ok: true });
});
