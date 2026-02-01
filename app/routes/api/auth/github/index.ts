import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const mode = c.req.query('mode');
  const redirectUri = new URL('/api/auth/github/callback', c.req.url).toString();
  const sessionId = c.get('session').id;
  const state = mode === 'popup' ? `${sessionId}:popup` : sessionId;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo user:email');
  url.searchParams.set('state', state);

  return c.redirect(url.toString());
});
