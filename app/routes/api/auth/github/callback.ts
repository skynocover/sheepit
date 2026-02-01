import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db';
import { users } from '../../../../db/schema';
import { encrypt } from '../../../../lib/crypto';
import { generateId } from '../../../../lib/id';
import * as github from '../../../../services/github';

export default createRoute(async (c) => {
  const code = c.req.query('code');
  const stateParam = c.req.query('state') ?? '';
  const session = c.get('session');

  // Decode popup mode from state
  const isPopup = stateParam.endsWith(':popup');
  const sessionId = isPopup ? stateParam.slice(0, -':popup'.length) : stateParam;

  if (!code || sessionId !== session.id) {
    return c.redirect('/?error=auth_failed');
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect('/?error=token_exchange_failed');
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return c.redirect('/?error=no_token');
  }

  const accessToken = tokenData.access_token;

  // Get GitHub user info
  const ghUser = await github.getUser(accessToken);

  // Encrypt token for storage
  const encryptedToken = await encrypt(accessToken, c.env.ENCRYPTION_KEY);

  // Upsert user in database
  const db = getDb(c.env.DB);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.githubId, String(ghUser.id)))
    .get();

  let userId: string;
  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        username: ghUser.login,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        githubToken: encryptedToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .run();
  } else {
    userId = generateId();
    await db
      .insert(users)
      .values({
        id: userId,
        githubId: String(ghUser.id),
        username: ghUser.login,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        githubToken: encryptedToken,
      })
      .run();
  }

  // Set session
  session.userId = userId;
  c.set('session', session);

  if (isPopup) {
    return c.html(`<!DOCTYPE html>
<html><body><script>
  window.opener.postMessage({ type: 'github-connected' }, '*');
  window.close();
</script></body></html>`);
  }

  return c.redirect('/dashboard');
});
