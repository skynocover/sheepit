import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { users } from '../../../../db/schema';
import { encrypt } from '../../../../lib/crypto';

export default createRoute(async (c) => {
  const code = c.req.query('code');
  const stateParam = c.req.query('state') ?? '';
  const session = c.get('session');

  // Decode popup mode from state
  const isPopup = stateParam.endsWith(':popup');
  const sessionId = isPopup ? stateParam.slice(0, -':popup'.length) : stateParam;

  if (!code || sessionId !== session.id) {
    return c.redirect('/dashboard?error=vercel_auth_failed');
  }

  if (!session.userId) {
    return c.redirect('/?error=not_logged_in');
  }

  // Exchange code for access token
  const redirectUri = new URL('/api/auth/vercel/callback', c.req.url).toString();
  const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.VERCEL_CLIENT_ID,
      client_secret: c.env.VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect('/dashboard?error=vercel_token_failed');
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return c.redirect('/dashboard?error=vercel_no_token');
  }

  // Encrypt and store token
  const encryptedToken = await encrypt(tokenData.access_token, c.env.ENCRYPTION_KEY);
  const db = getDb(c.env.DB);
  await db
    .update(users)
    .set({
      vercelToken: encryptedToken,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.userId))
    .run();

  if (isPopup) {
    return c.html(`<!DOCTYPE html>
<html><body><script>
  window.opener.postMessage({ type: 'vercel-connected' }, '*');
  window.close();
</script></body></html>`);
  }

  return c.redirect('/dashboard?vercel=connected');
});
