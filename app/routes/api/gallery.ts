import { createRoute } from 'honox/factory';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db';
import { projects, users } from '../../db/schema';

interface GalleryProject {
  id: string;
  name: string;
  description: string | null;
  framework: string | null;
  deploymentUrl: string | null;
  customDomain: string | null;
  subdomain: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
}

// GET /api/gallery - List all public, live projects
export const GET = createRoute(async (c) => {
  const db = getDb(c.env.DB);

  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      framework: projects.framework,
      deploymentUrl: projects.deploymentUrl,
      customDomain: projects.customDomain,
      subdomain: projects.subdomain,
      createdAt: projects.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(projects)
    .innerJoin(users, eq(projects.userId, users.id))
    .where(and(eq(projects.isPublic, true), eq(projects.status, 'live')))
    .orderBy(desc(projects.createdAt));

  const galleryProjects: GalleryProject[] = result.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }));

  return c.json({ projects: galleryProjects });
});
