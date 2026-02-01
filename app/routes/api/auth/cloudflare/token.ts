import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { users } from '../../../../db/schema';
import { requireAuth } from '../../../../lib/auth-guard';
import { encrypt } from '../../../../lib/crypto';
import * as cloudflare from '../../../../services/cloudflare';

// POST /api/auth/cloudflare/token — verify + store Cloudflare API token
export const POST = createRoute(requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json<{ token?: string }>().catch(() => ({}) as { token?: string });

  if (!body.token?.trim()) {
    return c.json({ error: 'Token is required' }, 400);
  }

  const token = body.token.trim();

  try {
    // Verify the token is valid
    await cloudflare.verifyToken(token);

    // Verify the token has zone:read permission by listing zones
    const zones = await cloudflare.listZones(token);

    // Encrypt and store
    const encryptedToken = await encrypt(token, c.env.ENCRYPTION_KEY);
    const db = getDb(c.env.DB);
    await db
      .update(users)
      .set({
        cloudflareToken: encryptedToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId!))
      .run();

    return c.json({ ok: true, zoneCount: zones.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cloudflare token verification failed:', message);
    return c.json(
      {
        error:
          'Invalid token or insufficient permissions. Ensure the token has Zone:Read and DNS:Edit permissions.',
      },
      400,
    );
  }
});
