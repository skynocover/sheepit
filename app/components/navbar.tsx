interface NavbarProps {
  username?: string;
  avatarUrl?: string;
  isLoggedIn?: boolean;
}

export default function Navbar({ username, avatarUrl, isLoggedIn }: NavbarProps) {
  return (
    <nav class="sticky top-0 z-50 glass-nav px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-6">
          <a href={isLoggedIn ? '/dashboard' : '/'} class="flex items-center gap-2.5 no-underline">
            <img src="/sheep-logo.png" alt="SheepIt" class="w-8 h-8" />
            <span class="text-2xl font-extrabold text-vs-gradient-brand">SheepIt</span>
          </a>
          <a
            href="/gallery"
            class="flex items-center gap-1.5 text-sm font-bold no-underline rounded-lg px-3.5 py-1.5 transition-all gallery-nav-link"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="url(#gal-g1)" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="url(#gal-g2)" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="url(#gal-g2)" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="url(#gal-g1)" />
              <defs>
                <linearGradient id="gal-g1" x1="0" y1="0" x2="16" y2="16">
                  <stop stop-color="#818cf8" />
                  <stop offset="1" stop-color="#34d399" />
                </linearGradient>
                <linearGradient id="gal-g2" x1="0" y1="0" x2="16" y2="16">
                  <stop stop-color="#34d399" />
                  <stop offset="1" stop-color="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
            <span class="text-vs-gradient-brand">Explore</span>
          </a>
        </div>

        <div class="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <a
                href="/dashboard/new"
                class="bg-vs-gradient-btn border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center gap-2 text-sm no-underline hover:opacity-90 transition-opacity"
              >
                <span>+</span> 新增專案
              </a>

              <div
                class="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style="background:rgba(255,255,255,0.05)"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" class="w-7 h-7 rounded-full" />
                ) : (
                  <div class="w-7 h-7 rounded-full bg-vs-gradient-btn flex items-center justify-center text-xs">
                    {username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span class="text-sm font-semibold">{username}</span>
              </div>

              <form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border-none transition-opacity hover:opacity-80"
                  style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7)"
                >
                  登出
                </button>
              </form>
            </>
          ) : (
            <a
              href="/api/auth/github"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm no-underline transition-all"
              style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              登入 GitHub
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
