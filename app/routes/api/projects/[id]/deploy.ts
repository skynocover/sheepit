import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { projects, deployments } from '../../../../db/schema';
import { requireAuth } from '../../../../lib/auth-guard';
import { generateId } from '../../../../lib/id';
import {
  getProjectByIdAndUser,
  getUserWithTokens,
  decryptUserToken,
} from '../../../../lib/project-helpers';
import * as vercel from '../../../../services/vercel';

// POST /api/projects/:id/deploy - Create Vercel project + trigger deployment, return immediately
export const POST = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('id');
  const db = getDb(c.env.DB);

  const project = await getProjectByIdAndUser(db, projectId, session.userId!);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  if (!project.githubRepo) {
    return c.json({ error: 'Push to GitHub first' }, 400);
  }

  const body = await c.req
    .json<{ vercelProjectName?: string; envVars?: Array<{ key: string; value: string }> }>()
    .catch(() => ({}));

  try {
    const user = await getUserWithTokens(db, session.userId!);
    if (!user || !user.vercelToken)
      return c.json({ error: 'Vercel not connected. Please connect Vercel first.' }, 400);

    const vercelToken = await decryptUserToken(user.vercelToken, c.env.ENCRYPTION_KEY);
    const [owner, repo] = project.githubRepo.split('/');

    // Create Vercel project if needed
    let vercelProjectId = project.vercelProjectId;
    if (!vercelProjectId) {
      const vercelName = body.vercelProjectName?.trim() || `sheepit-${project.subdomain}`;
      const vp = await vercel.createProject(vercelToken, {
        name: vercelName,
        gitRepository: { type: 'github', repo: project.githubRepo },
      });
      vercelProjectId = vp.id;
      await db
        .update(projects)
        .set({
          vercelProjectId,
          deploymentUrl: `https://${vercelName}.vercel.app`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .run();
    }

    // Set environment variables if provided (non-fatal — don't block deployment)
    if (body.envVars && body.envVars.length > 0) {
      try {
        await vercel.setEnvVars(vercelToken, vercelProjectId!, body.envVars);
      } catch (envErr) {
        console.warn(
          `Failed to set env vars for project ${projectId}:`,
          envErr instanceof Error ? envErr.message : envErr,
        );
      }
    }

    // Trigger deployment — derive name from stored domain or fallback
    const vercelDeployName = project.deploymentUrl
      ? project.deploymentUrl.replace('https://', '').replace('.vercel.app', '')
      : `sheepit-${project.subdomain}`;
    const deployment = await vercel.createDeployment(vercelToken, {
      name: vercelDeployName,
      gitSource: { type: 'github', org: owner, repo, ref: 'main' },
    });

    // Create deployment record
    const deploymentId = generateId();
    await db
      .insert(deployments)
      .values({
        id: deploymentId,
        projectId,
        vercelDeploymentId: deployment.id,
        status: 'building',
      })
      .run();

    await db
      .update(projects)
      .set({
        status: 'deploying',
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .run();

    // Return immediately — frontend polls /status for updates
    return c.json({ deploymentId, vercelDeploymentId: deployment.id, status: 'building' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Deploy failed for project ${projectId}:`, message);
    return c.json({ error: message }, 500);
  }
});
