import { createRoute } from 'honox/factory';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { projects, deployments } from '../../../../db/schema';
import { requireAuth } from '../../../../lib/auth-guard';
import {
  getProjectByIdAndUser,
  getUserWithTokens,
  decryptUserToken,
} from '../../../../lib/project-helpers';
import { fetchOgImage } from '../../../../lib/og';
import * as vercel from '../../../../services/vercel';

// GET /api/projects/:id/status - Get live deployment status from Vercel
export const GET = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('id') || '';
  const db = getDb(c.env.DB);

  const project = await getProjectByIdAndUser(db, projectId, session.userId!);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const latestDeployment = await db
    .select()
    .from(deployments)
    .where(eq(deployments.projectId, projectId))
    .orderBy(desc(deployments.createdAt))
    .get();

  // If there's an active Vercel deployment, check its live status
  if (
    latestDeployment?.vercelDeploymentId &&
    ['queued', 'building'].includes(latestDeployment.status)
  ) {
    try {
      const user = await getUserWithTokens(db, session.userId!);
      if (user?.vercelToken) {
        const vercelToken = await decryptUserToken(user.vercelToken, c.env.ENCRYPTION_KEY);
        const vd = await vercel.getDeployment(vercelToken, latestDeployment.vercelDeploymentId);

        const statusMap: Record<string, string> = {
          QUEUED: 'queued',
          BUILDING: 'building',
          INITIALIZING: 'building',
          READY: 'ready',
          ERROR: 'error',
          CANCELED: 'canceled',
        };
        const newStatus = statusMap[vd.readyState] || latestDeployment.status;

        if (newStatus !== latestDeployment.status) {
          const deployUrl = vd.readyState === 'READY' ? `https://${vd.url}` : null;

          await db
            .update(deployments)
            .set({
              status: newStatus as 'queued' | 'building' | 'ready' | 'error' | 'canceled',
              url: deployUrl,
              errorMessage: vd.readyState === 'ERROR' ? 'Deployment failed on Vercel' : null,
              updatedAt: new Date(),
            })
            .where(eq(deployments.id, latestDeployment.id))
            .run();

          if (vd.readyState === 'READY') {
            await db
              .update(projects)
              .set({
                status: 'live',
                updatedAt: new Date(),
              })
              .where(eq(projects.id, projectId))
              .run();

            // Background-fetch OG image and cache in DB
            const ogUrl = project.customDomain
              ? `https://${project.customDomain}`
              : project.deploymentUrl;
            if (ogUrl && !project.ogImage) {
              c.executionCtx.waitUntil(
                fetchOgImage(ogUrl).then(async (img) => {
                  if (img) {
                    await db
                      .update(projects)
                      .set({ ogImage: img })
                      .where(eq(projects.id, projectId))
                      .run();
                  }
                }),
              );
            }
          } else if (vd.readyState === 'ERROR' || vd.readyState === 'CANCELED') {
            await db
              .update(projects)
              .set({
                status: 'failed',
                updatedAt: new Date(),
              })
              .where(eq(projects.id, projectId))
              .run();
          }

          // Return updated data
          return c.json({
            project: {
              id: project.id,
              name: project.name,
              subdomain: project.subdomain,
              framework: project.framework,
              status:
                vd.readyState === 'READY'
                  ? 'live'
                  : vd.readyState === 'ERROR'
                    ? 'failed'
                    : project.status,
              deploymentUrl: project.deploymentUrl,
              githubRepo: project.githubRepo,
            },
            deployment: {
              id: latestDeployment.id,
              status: newStatus,
              url: deployUrl,
              errorMessage: vd.readyState === 'ERROR' ? 'Deployment failed on Vercel' : null,
              createdAt: latestDeployment.createdAt,
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to check Vercel status:', err);
    }
  }

  // Return DB data as-is
  return c.json({
    project: {
      id: project.id,
      name: project.name,
      subdomain: project.subdomain,
      framework: project.framework,
      status: project.status,
      deploymentUrl: project.deploymentUrl,
      githubRepo: project.githubRepo,
    },
    deployment: latestDeployment
      ? {
          id: latestDeployment.id,
          status: latestDeployment.status,
          url: latestDeployment.url,
          errorMessage: latestDeployment.errorMessage,
          createdAt: latestDeployment.createdAt,
        }
      : null,
  });
});
