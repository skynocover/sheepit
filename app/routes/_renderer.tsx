import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, Script } from 'honox/server';

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="zh-TW">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ?? 'SheepIt - 三分鐘讓你的程式碼上線'}</title>
        <meta name="description" content="上傳專案、推到 GitHub、部署到 Vercel，三分鐘搞定。" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sheepit.cc/" />
        <meta property="og:title" content="SheepIt - 三分鐘讓你的程式碼上線" />
        <meta
          property="og:description"
          content="上傳專案、推到 GitHub、部署到 Vercel，三分鐘搞定。"
        />
        <meta property="og:image" content="https://sheepit.cc/sheep-hero.png" />
        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />
      </head>
      <body class="min-h-screen bg-vs-gradient text-white font-sans relative overflow-x-hidden">
        {/* Background orbs */}
        <div style="position:fixed;top:-50%;right:-20%;width:800px;height:800px;background:radial-gradient(circle,rgba(52,211,153,0.1) 0%,transparent 70%);pointer-events:none;z-index:0" />
        <div style="position:fixed;bottom:-30%;left:-10%;width:600px;height:600px;background:radial-gradient(circle,rgba(251,191,36,0.06) 0%,transparent 70%);pointer-events:none;z-index:0" />
        <div class="relative z-10">{children}</div>
      </body>
    </html>
  );
});
