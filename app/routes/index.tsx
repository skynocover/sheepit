import { createRoute } from 'honox/factory';
import Navbar from '../components/navbar';

export default createRoute((c) => {
  const session = c.get('session');
  if (session?.userId) {
    return c.redirect('/dashboard');
  }

  const steps = [
    { num: 1, label: '拖進來', desc: '把專案資料夾拖進去就好', icon: '📁' },
    { num: 2, label: '幫你存好', desc: '自動幫你建好 GitHub 倉庫', icon: '🐙' },
    { num: 3, label: '一鍵上線', desc: '網站自動幫你部署完成', icon: '🚀' },
    { num: 4, label: '換你的網址', desc: '想用自己的網址也可以', icon: '🌐' },
  ];

  const features = [
    {
      icon: '🎯',
      title: '什麼專案都能上',
      desc: 'React、Vue、Next.js、純 HTML 通通幫你搞定，不用自己設定',
    },
    {
      icon: '🔒',
      title: '網站自帶安全鎖',
      desc: '自動幫你開啟 HTTPS，訪客看到安全鎖更安心',
    },
    {
      icon: '✨',
      title: '用你自己的網址',
      desc: '不想用免費網址？一鍵就能換成你自己的！',
    },
  ];

  return c.render(
    <div class="min-h-screen">
      <Navbar isLoggedIn={false} />

      <div class="px-6 py-16 max-w-[900px] mx-auto animate-slide-up">
        {/* Hero */}
        <div class="text-center mb-20">
          <div class="mb-6">
            <img
              src="/sheep-logo.png"
              alt="SheepIt"
              class="w-24 h-24 mx-auto animate-bounce-gentle"
              style="filter:drop-shadow(0 8px 24px rgba(52,211,153,0.3))"
            />
          </div>

          <h1 class="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            <span class="text-vs-gradient-warm">三分鐘</span>
            <br />
            讓你的作品上線給全世界看
          </h1>

          <p
            class="text-lg md:text-xl mb-10 leading-relaxed"
            style="color:rgba(255,255,255,0.7);max-width:480px;margin-left:auto;margin-right:auto"
          >
            不用懂程式、不用學部署
            <br />
            把資料夾拖進來，我們幫你搞定一切
          </p>

          <a
            href="/dashboard/new"
            class="inline-flex items-center gap-3 bg-vs-gradient-cta border-none rounded-2xl px-14 py-5 text-white text-xl font-extrabold cursor-pointer no-underline animate-glow-cta transition-all hover:-translate-y-1.5 hover:scale-105"
            style="box-shadow:0 8px 32px rgba(52,211,153,0.35)"
          >
            免費開始
            <span class="text-2xl">🐑</span>
          </a>
        </div>

        {/* Step flow */}
        <div class="mb-20">
          <h2 class="text-center text-2xl font-bold mb-8" style="color:rgba(255,255,255,0.85)">
            只要四步，你的網站就上線了
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                class="card-vs-warm p-6 text-center relative"
                style="cursor:default"
              >
                {i < 3 && (
                  <div
                    class="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-xl z-10"
                    style="color:rgba(52,211,153,0.4)"
                  >
                    →
                  </div>
                )}
                <div class="text-5xl mb-3">{step.icon}</div>
                <p class="font-bold text-lg mb-1" style="color:rgba(255,255,255,0.9)">
                  {step.label}
                </p>
                <p class="text-xs" style="color:rgba(255,255,255,0.45)">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div class="mb-16">
          <h2 class="text-center text-2xl font-bold mb-8" style="color:rgba(255,255,255,0.85)">
            為什麼選 SheepIt?
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((item, i) => (
              <div key={i} class="card-vs-warm p-8 text-center" style="cursor:default">
                <div class="text-4xl mb-4">{item.icon}</div>
                <h3 class="font-bold text-lg mb-2">{item.title}</h3>
                <p class="leading-relaxed" style="color:rgba(255,255,255,0.55);font-size:0.95rem">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div class="text-center py-12">
          <p class="text-xl font-bold mb-6" style="color:rgba(255,255,255,0.8)">
            準備好讓你的作品被看見了嗎？
          </p>
          <a
            href="/dashboard/new"
            class="inline-flex items-center gap-3 bg-vs-gradient-cta border-none rounded-2xl px-12 py-4 text-white text-lg font-bold cursor-pointer no-underline animate-glow-cta transition-all hover:-translate-y-1.5 hover:scale-105"
            style="box-shadow:0 8px 32px rgba(52,211,153,0.35)"
          >
            馬上試試看
            <span class="text-xl">→</span>
          </a>
        </div>
      </div>
    </div>,
  );
});
