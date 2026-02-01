import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { projects } from '../../../../db/schema';
import { requireAuth } from '../../../../lib/auth-guard';
import { shouldIgnore } from '../../../../lib/constants';
import { detectFramework } from '../../../../lib/detect';
import {
  getProjectByIdAndUser,
  getUserWithTokens,
  decryptUserToken,
} from '../../../../lib/project-helpers';
import * as github from '../../../../services/github';

interface UploadFile {
  path: string;
  content: string; // base64
}

// POST /api/projects/:id/push - Upload files + push to GitHub
export const POST = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const projectId = c.req.param('id');
  const db = getDb(c.env.DB);

  const project = await getProjectByIdAndUser(db, projectId, session.userId!);
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const body = await c.req.json<{ files: UploadFile[]; repoName?: string }>();
  if (!body.files || body.files.length === 0) {
    return c.json({ error: 'No files provided' }, 400);
  }

  try {
    const user = await getUserWithTokens(db, session.userId!);
    if (!user) return c.json({ error: 'User not found' }, 404);

    const githubToken = await decryptUserToken(user.githubToken, c.env.ENCRYPTION_KEY);

    // Filter ignored files
    const files = body.files.filter((f) => !shouldIgnore(f.path));
    if (files.length === 0) {
      return c.json({ error: 'No valid files after filtering' }, 400);
    }

    // Detect framework
    const filePaths = files.map((f) => f.path);
    const pkgFile = files.find((f) => f.path === 'package.json');
    let packageJson: Record<string, unknown> | undefined;
    if (pkgFile) {
      try {
        packageJson = JSON.parse(atob(pkgFile.content));
      } catch {}
    }
    const detection = detectFramework(filePaths, packageJson);

    // Create GitHub repo if needed
    let repoFullName = project.githubRepo;
    let isNewRepo = false;

    if (!repoFullName) {
      const repoName = body.repoName?.trim() || `sheepit-${project.subdomain}`;
      const ghUser = await github.getUser(githubToken);

      try {
        const repo = await github.createRepo(githubToken, repoName);
        repoFullName = repo.full_name;
        isNewRepo = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('422') && msg.includes('already exists')) {
          repoFullName = `${ghUser.login}/${repoName}`;
        } else {
          throw err;
        }
      }

      await db
        .update(projects)
        .set({
          githubRepo: repoFullName,
          framework: detection.framework,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .run();

      if (isNewRepo) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Push files
    const [owner, repo] = repoFullName.split('/');
    console.log(`Pushing ${files.length} files to ${owner}/${repo}`);
    await github.pushFiles(githubToken, owner, repo, files, 'Deploy via SheepIt');
    console.log(`Push complete for ${owner}/${repo}`);

    return c.json({
      githubRepo: repoFullName,
      githubUrl: `https://github.com/${repoFullName}`,
      framework: detection.framework,
      fileCount: files.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Push failed for project ${projectId}:`, message);
    return c.json({ error: message }, 500);
  }
});
