# CLAUDE.md

## Commands

- **Dev server**: `npm run dev` (or `pnpm dev`) — starts Vite dev server with Cloudflare adapter
- **Build**: `npm run build` — runs `vite build --mode client && vite build` (client then SSR)
- **Preview**: `npm run preview` — runs `wrangler dev` against built output
- **Deploy**: `npm run deploy` — builds then `wrangler deploy`
- **DB migrations**: `npx drizzle-kit generate` then `npx drizzle-kit migrate`
- **Type check**: `npx tsc --noEmit` (note: some pre-existing drizzle-orm type issues exist)

## Architecture

HonoX app running on Cloudflare Workers. File-based routing under `app/routes/`. UI is Traditional Chinese (zh-TW).

**Runtime**: Cloudflare Workers + D1 (SQLite) + KV (sessions)
**Frontend**: HonoX islands architecture + Tailwind CSS v4 (with `@theme` block in `style.css`)
**ORM**: Drizzle ORM — schema in `app/db/schema.ts` (users, projects, deployments tables)
**Auth**: GitHub OAuth for login, Vercel OAuth for deploy, Cloudflare API token for DNS

### Key directories

- `app/routes/` — file-based routing (pages + API)
- `app/routes/api/` — JSON API endpoints (auth, projects CRUD, deploy, domain)
- `app/islands/` — client-side hydrated components (auto-registered by HonoX)
- `app/components/` — server-only components (e.g. navbar)
- `app/lib/` — shared utilities (auth, session, crypto, framework detection)
- `app/db/` — database connection + Drizzle schema

### Data flow

1. User uploads project files via deploy-wizard island
2. Files are sent to `POST /api/projects` (creates project + stores files)
3. `POST /api/projects/:id/push` pushes to GitHub
4. `POST /api/projects/:id/deploy` triggers Vercel deployment
5. `GET /api/projects/:id/status` is polled for deployment progress

## Critical: HonoX Island Rules

Islands use `hono/jsx`, NOT React. Key differences:

- Use `class=` not `className=`
- Use `style="string"` not `style={{ object }}`
- Import hooks from `'hono/jsx'` (useState, useEffect, etc.)
- **NEVER import one island file from another island file.** This triggers a known hydration bug (HonoX Issue #154) where child islands evaluate multiple times and states reset. Instead, inline shared logic or extract it to `app/lib/`.
- **`<honox-island>` 需要 `display: contents`**。HonoX 用 `<honox-island>` 自訂元素包裹 island 組件，瀏覽器預設為 `display: inline`，會導致 block 子元素的事件處理器（onClick 等）無法正常運作。`style.css` 中已加上 `honox-island { display: contents; }` 修復，**不要移除這條規則**。

## Environment Bindings

Defined in `wrangler.jsonc`:
- `DB` — D1 database binding
- `SESSION` — KV namespace for sessions
- Secrets (set via `wrangler secret`): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET`, `SESSION_SECRET`

## Critical Rules

### ✅ DO
- 使用 TypeScript，不要使用 `any` 類型
- 為每個函數定義參數和返回類型
- Always start by creating a detailed todo list for the current task.
- Check the todo list before starting each step, and update it after each step.
- 確認TODO.md 的內容 必要時可以修改 例如做完或是你認為需要加上或補充的
- 在測試時 開啟了服務需要關閉 否則port會被佔用
- 使用axios而不是fetch
- function 使用 arrow function
- 使用`'` 而不是`"`
- 每次寫完程式碼後 使用.prettierrc來做format

### ❌ NEVER
- **不要修改 package.json 的依賴版本**
- **不要創建超過 300 行的組件文件**
- 不要自己寫CSS, 而是使用tailwind
- 不要擅自對正式區進行部署或執行任何命令

### ⚠️ IMPORTANT
如果 Claude 建議違反上述規則，請要求我（用戶）確認。
