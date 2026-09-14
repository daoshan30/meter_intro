import Link from "next/link";
import { DownloadRequestForm } from "@/components/downloads/DownloadRequestForm";

const fileHash = "BA1421E37FB60990BD23CB1307AF3327F5EA28EC0106019E91DDF6E59C8D84B5";

export default function Bk880DownloadPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-900 selection:bg-indigo-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute -right-20 top-72 h-[28rem] w-[28rem] rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:px-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/65 px-5 py-3 shadow-[0_12px_40px_rgba(71,85,105,0.10)] backdrop-blur-xl">
          <Link className="flex items-center gap-3" href="/" aria-label="回到 Meter Intro 首頁">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-black text-white shadow-lg shadow-indigo-300/60">
              MI
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.16em] text-slate-800">
                METER INTRO
              </span>
              <span className="block text-[9px] font-bold tracking-[0.18em] text-slate-400">
                BK880 FREE TOOL
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <Link className="transition hover:text-indigo-600" href="/">
              首頁
            </Link>
            <Link className="transition hover:text-indigo-600" href="/bk880">
              BK880 WebSerial
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-start gap-8 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-indigo-600 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            WINDOWS FREE TOOL
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] text-slate-900 sm:text-5xl lg:text-6xl">
            BK880 v3.1
            <span className="block bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              USB COM CSV Logger
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
            免費 Windows 工具，可透過 USB COM 連接 BK880 / LCR-615，執行單次量測、表格累積與 CSV 存檔。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["版本", "v3.1"],
              ["系統", "Windows"],
              ["檔案", "EXE"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-lg font-black text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/80 bg-white/60 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-black text-slate-800">按鈕與功能</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>連線：選擇 COM Port 後連接儀器。</li>
              <li>重新整理：重新掃描可用 COM Port。</li>
              <li>套用設定：送出主參數、第二參數、頻率與 Tolerance。</li>
              <li>立即讀取：讀取一次目前量測值並加入表格。</li>
              <li>存檔：將目前表格輸出為 CSV。</li>
              <li>清除紀錄：清空畫面上的量測表格。</li>
            </ul>
          </div>
        </div>

        <div className="lg:sticky lg:top-8">
          <DownloadRequestForm />
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 px-6 pb-20 sm:px-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-black text-slate-800">使用前提醒</h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>1. 先用 USB 將 BK880 / LCR-615 連接到電腦。</li>
            <li>2. 關閉可能占用同一個 COM Port 的程式。</li>
            <li>3. 雙擊 EXE 啟動，選擇 COM Port 後按「連線」。</li>
            <li>4. 改設定後請先按「套用設定」，再按「立即讀取」。</li>
          </ol>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-black text-slate-800">檔案完整性</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            下載後可用 SHA256 比對檔案是否完整。若之後重新打包，SHA256 也會跟著改變。
          </p>
          <code className="mt-4 block break-all rounded-2xl bg-slate-900 px-4 py-3 font-mono text-xs text-white">
            {fileHash}
          </code>
        </div>
      </section>
    </main>
  );
}
