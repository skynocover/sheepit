import { createRoute } from 'honox/factory';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { users, projects } from '../db/schema';
import { timeAgo } from '../lib/time';
import Navbar from '../components/navbar';

/** Generate a screenshot thumbnail URL for sites without og:image */
const screenshotUrl = (siteUrl: string): string =>
  `https://image.thum.io/get/width/640/crop/360/https://${siteUrl.replace(/^https?:\/\//, '')}`;

const frameworkIcon: Record<string, string> = {
  'Next.js': '▲',
  Nuxt: '💚',
  Vite: '⚡',
  'Create React App': '⚛️',
  Astro: '🚀',
  SvelteKit: '🔥',
  Remix: '💿',
};

export default createRoute(async (c) => {
  const session = c.get('session');
  const db = getDb(c.env.DB);

  let user: { username: string; avatarUrl: string | null } | undefined;
  if (session?.userId) {
    user = await db
      .select({ username: users.username, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.userId))
      .get();
  }

  const galleryProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      framework: projects.framework,
      deploymentUrl: projects.deploymentUrl,
      customDomain: projects.customDomain,
      subdomain: projects.subdomain,
      ogImage: projects.ogImage,
      createdAt: projects.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(projects)
    .innerJoin(users, eq(projects.userId, users.id))
    .where(and(eq(projects.isPublic, true), eq(projects.status, 'live')))
    .orderBy(desc(projects.createdAt));

  return c.render(
    <div class="min-h-screen">
      <Navbar
        isLoggedIn={!!session?.userId}
        username={user?.username}
        avatarUrl={user?.avatarUrl ?? undefined}
      />

      <main class="max-w-6xl mx-auto px-6 py-10 animate-slide-up">
        <div class="mb-10">
          <h1 class="text-3xl font-bold mb-1">Gallery</h1>
          <p style="color:rgba(255,255,255,0.5)">探索社群部署的專案</p>
        </div>

        {galleryProjects.length === 0 ? (
          <div
            class="card-vs p-16 text-center"
            style="border:2px dashed rgba(255,255,255,0.1);cursor:default"
          >
            <div class="text-5xl mb-5">🎨</div>
            <h2 class="text-xl font-bold mb-3">還沒有公開的專案</h2>
            <p style="color:rgba(255,255,255,0.5)">部署你的專案，讓大家看到你的作品！</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryProjects.map((project, i) => {
              const siteUrl = project.customDomain
                ? `https://${project.customDomain}`
                : project.deploymentUrl || '#';
              const displayUrl =
                project.customDomain ||
                project.deploymentUrl?.replace('https://', '') ||
                `${project.subdomain}.sheepit.cc`;
              const icon = project.framework ? frameworkIcon[project.framework] || '📦' : '📦';

              return (
                <a
                  key={project.id}
                  href={siteUrl}
                  target="_blank"
                  rel="noopener"
                  class="gallery-card block no-underline text-white"
                  style={`animation:slideIn 0.4s ease ${i * 0.08}s both`}
                >
                  {/* Preview Image */}
                  <div
                    class="w-full"
                    style="aspect-ratio:16/9;background:linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(52,211,153,0.1) 100%);position:relative;overflow:hidden"
                  >
                    <img
                      src={project.ogImage || screenshotUrl(siteUrl)}
                      alt={project.name}
                      class="w-full h-full"
                      style="object-fit:cover;display:block"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div class="p-5">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-base">{icon}</span>
                      <h3 class="font-bold text-base truncate">{project.name}</h3>
                    </div>

                    {project.description ? (
                      <p
                        class="text-sm mb-3"
                        style="color:rgba(255,255,255,0.55);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"
                      >
                        {project.description}
                      </p>
                    ) : (
                      <p class="text-sm mb-3" style="color:rgba(255,255,255,0.3)">
                        {displayUrl}
                      </p>
                    )}

                    <div
                      class="flex items-center justify-between pt-3"
                      style="border-top:1px solid rgba(255,255,255,0.06)"
                    >
                      <div class="flex items-center gap-2">
                        {project.avatarUrl ? (
                          <img src={project.avatarUrl} alt="" class="w-5 h-5 rounded-full" />
                        ) : (
                          <div
                            class="w-5 h-5 rounded-full bg-vs-gradient-btn flex items-center justify-center"
                            style="font-size:10px"
                          >
                            {project.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span class="text-xs" style="color:rgba(255,255,255,0.5)">
                          {project.username}
                        </span>
                      </div>
                      <span class="text-xs" style="color:rgba(255,255,255,0.3)">
                        {timeAgo(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>,
    { title: 'Gallery - SheepIt' },
  );
});
