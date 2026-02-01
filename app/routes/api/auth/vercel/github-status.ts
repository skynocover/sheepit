import { createRoute } from 'honox/factory';
import { requireAuth } from '../../../../lib/auth-guard';
import { getDb } from '../../../../db';
import { getUserWithTokens, decryptUserToken } from '../../../../lib/project-helpers';
import * as vercel from '../../../../services/vercel';

/** GET /api/auth/vercel/github-status
 *  Checks if the user's GitHub account has the Vercel GitHub App installed.
 *  Returns { installed: boolean, installUrl: string }
 */
export const GET = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const db = getDb(c.env.DB);

  const user = await getUserWithTokens(db, session.userId!);
  if (!user?.vercelToken) {
    return c.json({
      installed: false,
      installUrl: 'https://github.com/apps/vercel/installations/new',
    });
  }

  try {
    const vercelToken = await decryptUserToken(user.vercelToken, c.env.ENCRYPTION_KEY);
    const namespaces = await vercel.getGitNamespaces(vercelToken);

    // Check if any namespace matches the user's GitHub username
    const githubUsername = user.username;
    const installed = namespaces.some(
      (ns) => ns.slug.toLowerCase() === githubUsername?.toLowerCase(),
    );

    return c.json({
      installed,
      installUrl: 'https://github.com/apps/vercel/installations/new',
    });
  } catch (err) {
    console.warn('Failed to check Vercel GitHub App status:', err);
    // If check fails, assume not installed to be safe
    return c.json({
      installed: false,
      installUrl: 'https://github.com/apps/vercel/installations/new',
    });
  }
});
