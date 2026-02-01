# SheepIt - 專案規劃文件

> 幫助 Vibe coding 小白一鍵上線的服務平台 (sheepit.cc)

## 專案概念

### 目標用戶
- 使用 Vibe coding（如 Cursor、Bolt.new、v0.dev）產出程式碼的小白
- 會寫程式但不懂部署、DNS、環境變數設定的人
- 想要「一鍵上線，給朋友看」的人

### 核心價值
- Vibe coding 能寫出「程式碼」，但無法幫用戶「操作」和「設定」
- 我們解決的是 Vibe coding 解決不了的最後一哩路

### 我們不做的事
- 登入註冊、權限管理等 Vibe coding 可以解決的功能
- 與 Vercel/Netlify 正面競爭

---

## 技術架構

### 部署環境
- **平台**：Cloudflare Workers
- **框架**：HonoX（前端 + 後端）

### Cloudflare 服務使用

| 服務 | 用途 |
|------|------|
| D1 | SQLite 資料庫（用戶資料、專案狀態、加密後的 Token） |

### 架構圖

```
┌────────────────────────────────────────────┐
│            Cloudflare Workers              │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │             HonoX App                │  │
│  │  ┌─────────────┐ ┌─────────────────┐ │  │
│  │  │  Frontend   │ │  API Routes     │ │  │
│  │  │  (SSR)      │ │  /api/*         │ │  │
│  │  └─────────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────┘  │
│                    │                       │
│                    ▼                       │
│              ┌──────────┐                  │
│              │    D1    │                  │
│              │   (DB)   │                  │
│              └──────────┘                  │
└────────────────────────────────────────────┘
```

---

## 已完成功能

### P0 - MVP 核心
- [x] GitHub OAuth 授權（`repo` scope）
- [x] Repo 建在用戶自己帳號下
- [x] 拖曳資料夾上傳（`webkitGetAsEntry`）
- [x] 上傳 ZIP 檔
- [x] 前端過濾不需要的檔案（node_modules、.git、.env 等）
- [x] GitHub Trees API 一次推送所有檔案
- [x] Vercel OAuth 授權
- [x] 自動連結 GitHub repo 到 Vercel
- [x] 偵測專案類型（Next.js、Vite、靜態網站等）
- [x] 自動設定 Build 指令
- [x] 部署狀態追蹤（前端 polling）
- [x] 免費 subdomain
- [x] Signed Cookie Session（HMAC-SHA256，無 KV 依賴）
- [x] Token 加密儲存（AES）
- [x] 環境變數自動偵測、編輯、同步到 Vercel
- [x] QR Code（專案詳情頁顯示 + 下載）
- [x] Gallery 頁面（公開專案展示）
- [x] 登出功能
- [x] Cloudflare API Token DNS 管理（自訂 Domain）
- [x] Dashboard 專案列表
- [x] OG image 背景抓取（waitUntil）

### 程式碼優化（已完成）
- [x] 刪除 dead code（domain-setup、deploy-status、cloudflare-connect islands）
- [x] DRY 重構（timeAgo、fileReader、status config、project-helpers）
- [x] 消除 `any` 類型
- [x] 全部改為 arrow function
- [x] KV Session → Signed Cookie

---

## 待辦功能

### P1 - 體驗升級

#### 環境變數統一管理面板
- [ ] project-detail 內的 env var 編輯介面

#### 資料庫自動建立
- [ ] 掃描 `package.json` 偵測使用的 ORM/DB
  - Prisma + PostgreSQL → 推薦 Neon/Supabase
  - Drizzle + Postgres → 推薦 Neon/Supabase
  - @supabase/supabase-js → Supabase
  - mongoose → MongoDB Atlas
- [ ] Supabase OAuth 或 Neon OAuth
- [ ] 自動建立 DB 專案
- [ ] 自動注入 DATABASE_URL 到環境變數
- [ ] 自動執行 migration

#### 部署狀態與通知
- [ ] 部署完成/失敗通知
- [ ] 支援 Discord Webhook
- [ ] 支援 LINE Notify

#### 一鍵回滾
- [ ] 顯示部署歷史
- [ ] 一鍵回到上一版

---

### P2 - 商業化功能

#### 監控功能
- [ ] Uptime 監控（Cron Trigger 定期 ping）
- [ ] 網站掛掉時發通知
- [ ] Sentry OAuth 串接（錯誤追蹤）

#### 其他第三方服務串接
- [ ] Resend（郵件發送）
- [ ] Stripe Connect（金流）
- [ ] Uploadthing / R2（檔案儲存）

---

## 第三方服務串接規劃

### 已完成

| 服務 | 串接方式 | 用途 |
|------|----------|------|
| GitHub | OAuth | 程式碼託管 |
| Vercel | OAuth | 部署 |
| Cloudflare | API Token | DNS 管理 |

### 第二波

| 服務 | 串接方式 | 用途 |
|------|----------|------|
| Supabase | OAuth / Management API | 資料庫 |
| Neon | OAuth / API | 資料庫 |
| Sentry | OAuth | 錯誤追蹤 |
| Discord | Webhook URL | 通知 |
| LINE Notify | OAuth | 通知 |

### 第三波

| 服務 | 串接方式 | 用途 |
|------|----------|------|
| Resend | API Key | 郵件 |
| Stripe | OAuth Connect | 金流 |
| Railway | OAuth | 後端部署 |

---

## 安全性考量

### Token 加密儲存
D1 是明文存儲，使用 AES 加密敏感資料（已實作於 `app/lib/crypto.ts`）。

需要加密的資料：
- GitHub Access Token
- Vercel Access Token
- Cloudflare API Token

---

## OAuth 設定說明

### GitHub OAuth

```
申請位置：GitHub Settings → Developer settings → OAuth Apps

Scopes 需要：
- repo（讀寫 repository）

Callback URL：
https://<your-domain>/api/auth/github/callback
```

### Vercel OAuth

```
申請位置：Vercel Dashboard → Settings → OAuth Apps

Scopes 需要：
- 預設 scope 即可（project 管理權限）

Callback URL：
https://<your-domain>/api/auth/vercel/callback
```

### Cloudflare API Token（用戶自行建立）

```
引導用戶步驟：
1. 前往 Cloudflare Dashboard
2. My Profile → API Tokens → Create Token
3. 使用「Edit zone DNS」模板
4. 選擇要授權的 Domain
5. 複製 Token 貼到我們的平台

Token 權限設定：
- Zone:Zone:Read
- Zone:DNS:Edit
- Zone Resources: 選擇特定 zone 或 All zones
```

---

## TODO
- i18n
