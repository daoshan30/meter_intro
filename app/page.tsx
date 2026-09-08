const products = [
  {
    code: "01",
    title: "數位萬用電錶",
    english: "DIGITAL MULTIMETER",
    description: "快速讀取電壓、電流與電阻，讓日常維護與研發測試更直覺。",
    specs: ["6½ 位元解析度", "True RMS", "USB / LAN"],
    icon: "VΩ",
    tone: "from-sky-100 to-indigo-100",
  },
  {
    code: "02",
    title: "LCR Meter",
    english: "PRECISION LCR METER",
    description: "精準掌握元件的阻抗特性，支援品質驗證與材料分析流程。",
    specs: ["20 Hz – 100 kHz", "Cp / D / Rp / θ", "比較分選"],
    icon: "LCR",
    tone: "from-violet-100 to-fuchsia-100",
  },
  {
    code: "03",
    title: "示波器",
    english: "DIGITAL OSCILLOSCOPE",
    description: "清楚呈現訊號細節與觸發事件，讓除錯與驗證更加有效率。",
    specs: ["4 通道輸入", "高取樣率", "進階觸發"],
    icon: "∿",
    tone: "from-cyan-100 to-teal-100",
  },
];

/**
 * Meter_intro 的極簡玻璃亮面首頁。
 * 根路由以 Server Component 呈現靜態品牌與產品資訊，
 * 不需要用戶端狀態，因而不額外載入互動 JavaScript。
 */
export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-900 selection:bg-indigo-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute -right-20 top-72 h-[28rem] w-[28rem] rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:px-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/65 px-5 py-3 shadow-[0_12px_40px_rgba(71,85,105,0.10)] backdrop-blur-xl">
          <a className="flex items-center gap-3" href="#top" aria-label="Meter Intro 首頁">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-black text-white shadow-lg shadow-indigo-300/60">MI</span>
            <span>
              <span className="block text-sm font-black tracking-[0.16em] text-slate-800">METER INTRO</span>
              <span className="block text-[9px] font-bold tracking-[0.18em] text-slate-400">PRECISION MADE SIMPLE</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-bold text-slate-500 md:flex">
            <a className="transition hover:text-indigo-600" href="#products">產品</a>
            <a className="transition hover:text-indigo-600" href="#capability">特色</a>
            <a className="rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-lg shadow-slate-300 transition hover:bg-indigo-600" href="#contact">聯絡我們</a>
          </nav>
        </div>
      </header>

      <section id="top" className="relative z-0 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-28">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-indigo-600 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> MEASUREMENT, REFINED
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.06em] text-slate-900 sm:text-6xl lg:text-7xl">
            AI時代需要
            <span className="bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">精準的量測</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
            Meter Intro 以清晰的操作體驗與穩定的量測表現，陪伴工程師完成每一次驗證、分析與決策。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-600" href="#products">探索產品</a>
            <a className="rounded-xl border border-white/90 bg-white/60 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white" href="#capability">了解特色</a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/55 p-4 shadow-[0_30px_80px_rgba(71,85,105,0.18)] backdrop-blur-2xl">
          <div className="rounded-[1.5rem] border border-white bg-gradient-to-br from-white/90 via-slate-50/80 to-sky-100/70 p-6">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.16em] text-slate-400">
              <span>LIVE MEASUREMENT</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-600">● STABLE</span>
            </div>
            <div className="mt-9 rounded-2xl border border-white bg-white/70 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400">DC VOLTAGE</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-mono text-5xl font-bold tracking-[-0.08em] text-slate-800">12.004</p>
                <p className="mb-2 font-mono text-sm text-indigo-500">V DC</p>
              </div>
              <svg className="mt-6 h-16 w-full" viewBox="0 0 360 64" role="img" aria-label="平穩訊號波形">
                <defs><linearGradient id="signal" x1="0" x2="1"><stop stopColor="#38bdf8" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
                <path d="M0 38 C20 38 24 18 45 18 S69 46 90 46 S114 18 135 18 S159 46 180 46 S204 18 225 18 S249 46 270 46 S294 18 315 18 S340 38 360 38" fill="none" stroke="url(#signal)" strokeLinecap="round" strokeWidth="3" />
                <path d="M0 54 H360" stroke="#cbd5e1" strokeDasharray="4 5" />
              </svg>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[['0.002%', 'ACCURACY'], ['100 kHz', 'BANDWIDTH'], ['4 CH', 'INPUT']].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-white/60 px-2 py-3">
                  <p className="text-sm font-black text-slate-700">{value}</p>
                  <p className="mt-1 text-[8px] font-bold tracking-[0.12em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="relative z-10 mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:pb-32">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-indigo-500">PRODUCTS</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">為每一種量測需求而生</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">簡潔介面、可靠讀值與彈性連線，為工作台上的每個步驟帶來更好的節奏。</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.code} className="group rounded-3xl border border-white/90 bg-white/60 p-6 shadow-[0_18px_50px_rgba(71,85,105,0.10)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_24px_65px_rgba(71,85,105,0.17)]">
              <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${product.tone} font-mono text-lg font-black text-slate-700 shadow-sm`}>{product.icon}</div>
              <div className="mt-8 flex items-center justify-between">
                <p className="text-[10px] font-bold tracking-[0.18em] text-indigo-500">{product.english}</p>
                <span className="text-xs font-bold text-slate-300">{product.code}</span>
              </div>
              <h3 className="mt-3 text-2xl font-black text-slate-800">{product.title}</h3>
              <p className="mt-4 min-h-14 text-sm leading-7 text-slate-500">{product.description}</p>
              <ul className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-600">
                {product.specs.map((spec) => <li key={spec} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />{spec}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="capability" className="relative z-10 border-y border-white/80 bg-white/45 py-20 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-3 sm:px-8">
          {[['01', '精準讀值', '以高解析度與穩定演算法，讓每一次判讀更有依據。'], ['02', '簡潔體驗', '清楚的資訊層級與直覺控制，降低操作與學習負擔。'], ['03', '靈活整合', '支援常用介面，輕鬆進入你的驗證與自動化工作流程。']].map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-black text-indigo-400">{number}</p>
              <h3 className="mt-4 text-xl font-black text-slate-800">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7 px-6 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-black tracking-[0.15em] text-slate-800">METER INTRO</p>
          <p className="mt-1 text-xs text-slate-400">Precision instruments, thoughtfully made.</p>
        </div>
        <a className="w-fit rounded-xl border border-white bg-white/65 px-5 py-3 text-sm font-bold text-indigo-600 shadow-sm backdrop-blur transition hover:bg-white" href="mailto:contact@meter-intro.example">CONTACT@METER-INTRO.EXAMPLE</a>
      </footer>
    </main>
  );
}

