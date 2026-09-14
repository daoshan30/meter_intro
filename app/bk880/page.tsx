import Link from "next/link";
import { Bk880WebSerialPanel } from "@/components/bk880/Bk880WebSerialPanel";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

/**
 * BK880 Web Serial 分頁。
 *
 * Route page 本身維持 Server Component，只有真正需要瀏覽器 API 的
 * Bk880WebSerialPanel 被切成 Client Component，以降低首頁與其他靜態區塊的 client bundle。
 */
export default function BK880Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7fb] px-5 py-6 text-slate-900 selection:bg-indigo-200 sm:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute -right-20 top-72 h-[28rem] w-[28rem] rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto mb-8 flex max-w-7xl items-center justify-between rounded-2xl border border-white/75 bg-white/65 px-5 py-3 shadow-[0_12px_40px_rgba(71,85,105,0.10)] backdrop-blur-xl">
        <Link className="flex items-center gap-3" href="/" aria-label="回到 Meter Intro 首頁">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-black text-white shadow-lg shadow-indigo-300/60">MI</span>
          <span>
            <span className="block text-sm font-black tracking-[0.16em] text-slate-800">METER INTRO</span>
            <span className="block text-[9px] font-bold tracking-[0.18em] text-slate-400">BK880 WEB SERIAL</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <PageViewTracker path="/bk880" label="BK880瀏覽" className="hidden sm:block" />
          <Link className="transition hover:text-indigo-600" href="/">首頁</Link>
          <Link className="transition hover:text-indigo-600" href="/downloads/bk880">免費下載</Link>
          <a className="rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-lg shadow-slate-300 transition hover:bg-indigo-600" href="https://meter.daoshan50.com/bk880">正式頁面</a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl">
        <Bk880WebSerialPanel />

        <section
          className="mt-8 rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-[0_18px_50px_rgba(71,85,105,0.12)] backdrop-blur-xl sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-8"
          aria-labelledby="lcr615-affiliate-title"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">
              LCR-615 購買資訊
            </p>
            <h2 id="lcr615-affiliate-title" className="mt-2 text-xl font-black text-slate-900">
              正在尋找 LCR-615 量測儀器？
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              可前往蝦皮查看目前商品價格、庫存與購買資訊。
            </p>
          </div>
          <a
            className="mt-5 inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-[#ee4d2d] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#d94225] sm:mt-0 sm:w-auto"
            href="https://s.shopee.tw/9Ki2tIcyV1"
            target="_blank"
            rel="noopener sponsored"
          >
            前往蝦皮查看 LCR-615
          </a>
          <p className="mt-5 text-xs leading-6 text-slate-400 sm:basis-full">
            ※ 此為蝦皮聯盟連結。透過此連結購買，您支付的價格不變，本站可能獲得分潤；商品價格、庫存與售後服務以蝦皮頁面為準。
          </p>
        </section>
      </div>
    </main>
  );
}
