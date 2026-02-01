import { createRoute } from 'honox/factory';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db';
import { users, projects, deployments } from '../../db/schema';
import { requireAuth } from '../../lib/auth-guard';
import Navbar from '../../components/navbar';
import ProjectDetail from '../../islands/project-detail';

export default createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('projectId');
  const db = getDb(c.env.DB);

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.userId!)))
    .get();

  if (!project) {
    return c.notFound();
  }

  const user = await db.select().from(users).where(eq(users.id, session.userId!)).get();
  const hasVercel = !!user?.vercelToken;
  const hasCloudflare = !!user?.cloudflareToken;

  const deploymentHistory = await db
    .select()
    .from(deployments)
    .where(eq(deployments.projectId, projectId))
    .orderBy(desc(deployments.createdAt));

  const serializedProject = {
    id: project.id,
    name: project.name,
    subdomain: project.subdomain,
    framework: project.framework,
    status: project.status,
    deploymentUrl: project.deploymentUrl,
    customDomain: project.customDomain,
    domainStatus: project.domainStatus,
    githubRepo: project.githubRepo,
    description: project.description,
    isPublic: project.isPublic,
    platform: 'vercel' as const,
    createdAt:
      project.createdAt instanceof Date
        ? project.createdAt.toISOString()
        : String(project.createdAt),
  };

  const serializedDeployments = deploymentHistory.map((d) => ({
    id: d.id,
    status: d.status,
    url: d.url,
    errorMessage: d.errorMessage,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
  }));

  return c.render(
    <div class="min-h-screen">
      <Navbar
        isLoggedIn={true}
        username={user?.username}
        avatarUrl={user?.avatarUrl ?? undefined}
      />

      <main class="max-w-4xl mx-auto px-6 py-10 animate-slide-up">
        <ProjectDetail
          project={serializedProject}
          deployments={serializedDeployments}
          hasVercel={hasVercel}
          hasCloudflare={hasCloudflare}
        />
      </main>
    </div>,
    { title: `${project.name} - SheepIt` },
  );
});
