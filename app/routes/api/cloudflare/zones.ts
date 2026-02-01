import { createRoute } from 'honox/factory';
import { getDb } from '../../../db';
import { requireAuth } from '../../../lib/auth-guard';
import { getUserWithTokens, decryptUserToken } from '../../../lib/project-helpers';
import * as cloudflare from '../../../services/cloudflare';

// GET /api/cloudflare/zones — list user's Cloudflare zones
export const GET = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const db = getDb(c.env.DB);

  const user = await getUserWithTokens(db, session.userId!);
  if (!user?.cloudflareToken) {
    return c.json({ error: 'Cloudflare not connected' }, 400);
  }

  try {
    const token = await decryptUserToken(user.cloudflareToken, c.env.ENCRYPTION_KEY);
    const zones = await cloudflare.listZones(token);
    return c.json({
      zones: zones.map((z) => ({ id: z.id, name: z.name, status: z.status })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to list Cloudflare zones:', message);
    return c.json({ error: 'Failed to fetch zones from Cloudflare' }, 500);
  }
});
