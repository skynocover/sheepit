import { createRoute } from 'honox/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { users } from '../../db/schema';
import Navbar from '../../components/navbar';
import DeployWizard from '../../islands/deploy-wizard';

export default createRoute(async (c) => {
  const session = c.get('session');
  let isLoggedIn = false;
  let hasVercel = false;
  let hasCloudflare = false;
  let username: string | undefined;
  let avatarUrl: string | undefined;

  if (session?.userId) {
    const db = getDb(c.env.DB);
    const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
    if (user) {
      isLoggedIn = true;
      hasVercel = !!user.vercelToken;
      hasCloudflare = !!user.cloudflareToken;
      username = user.username;
      avatarUrl = user.avatarUrl ?? undefined;
    }
  }

  return c.render(
    <div class="min-h-screen">
      <Navbar isLoggedIn={isLoggedIn} username={username} avatarUrl={avatarUrl} />

      <main class="max-w-3xl mx-auto px-6 py-10">
        <DeployWizard isLoggedIn={isLoggedIn} hasVercel={hasVercel} hasCloudflare={hasCloudflare} />
      </main>
    </div>,
    { title: '新增專案 - SheepIt' },
  );
});
