"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_SECONDARY,
  FREQUENCIES,
  PRIMARY_PARAMETERS,
  SECONDARY_PARAMETERS,
  TOLERANCE_RANGES,
  type BK880Configuration,
  type BK880Reading,
  type PrimaryParameter,
  type SecondaryParameter,
  type ToleranceRange,
} from "@/lib/bk880/models";
import { BK880ScpiService } from "@/lib/bk880/bk880ScpiService";
import { WebSerialPort } from "@/lib/bk880/webSerialPort";
import { formatEngineering, formatPortInfo } from "@/lib/bk880/format";

const INITIAL_CONFIGURATION: BK880Configuration = {
  primary: "C",
  secondary: "D",
  frequency: 100_000,
  toleranceEnabled: false,
  toleranceRange: 1,
};

/**
 * Meter_intro 內嵌版 BK880 Web Serial 操作面板。
 *
 * 此 component 必須宣告為 Client Component，因為它需要瀏覽器端的
 * `navigator.serial`、React state、button click event 與 Web Streams。
 * 實際序列埠連線發生在使用者自己的瀏覽器與本機電腦，不會由 Vercel server
 * 代替使用者連接儀器。
 */
export function Bk880WebSerialPanel() {
  const transportRef = useRef<WebSerialPort | null>(null);
  const [configuration, setConfiguration] = useState<BK880Configuration>(INITIAL_CONFIGURATION);
  const [isSupported] = useState(() => WebSerialPort.isSupported());
  const [isConnected, setIsConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("尚未連線");
  const [instrumentInfo, setInstrumentInfo] = useState("尚未讀取");
  const [settingsStatus, setSettingsStatus] = useState("尚未套用設定");
  const [reading, setReading] = useState<BK880Reading | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const transport = new WebSerialPort();
    transport.onDisconnect(() => {
      setIsConnected(false);
      setConnectionStatus("BK880 已中斷連線（裝置可能已拔除）。");
      setError("序列裝置已中斷，請確認 USB 連線後重新選擇並連線。");
    });
    transportRef.current = transport;

    // 頁面切換或元件卸載時釋放瀏覽器對序列埠的 lock，避免下一次重連失敗。
    return () => {
      transport.onDisconnect(null);
      void transport.close();
      transportRef.current = null;
    };
  }, []);

  /**
   * 主參數變更後同步套用建議次參數。
   * 這樣可減少不合理組合，也保留使用者後續手動調整次參數的自由。
   */
  const updatePrimary = (primary: PrimaryParameter): void => {
    setConfiguration((current) => ({
      ...current,
      primary,
      secondary: DEFAULT_SECONDARY[primary],
    }));
  };

  /**
   * 由使用者點擊按鈕觸發 Serial Port 選擇器。
   * Web Serial API 規定 requestPort 必須由 user gesture 啟動，不能在頁面載入時自動執行。
   */
  const connect = async (): Promise<void> => {
    const transport = transportRef.current;
    if (transport === null) {
      return;
    }

    setIsBusy(true);
    setError("");
    try {
      const info = await transport.requestAndOpen();
      const idn = await new BK880ScpiService(transport).identify();
      setIsConnected(true);
      setConnectionStatus(formatPortInfo(info));
      setInstrumentInfo(idn);
      setSettingsStatus("已連線，請確認設定後按「套用設定並量測」。");
    } catch (caught) {
      setIsConnected(false);
      setConnectionStatus("連線失敗");
      setError(toMessage(caught));
    } finally {
      setIsBusy(false);
    }
  };

  /** 手動關閉目前序列連線，讓 BK880 可以被其他程式或下一次瀏覽器授權重新使用。 */
  const disconnect = async (): Promise<void> => {
    setIsBusy(true);
    setError("");
    try {
      await transportRef.current?.close();
      setIsConnected(false);
      setConnectionStatus("已中斷連線");
      setInstrumentInfo("尚未讀取");
      setSettingsStatus("尚未套用設定");
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setIsBusy(false);
    }
  };

  /**
   * 套用目前 UI 設定並執行單次量測。
   * 底層服務沿用已實機驗證的 LabVIEW 相容流程：LF 結尾、設定後等待、雙 FETCH?。
   */
  const configureAndMeasure = async (): Promise<void> => {
    const transport = transportRef.current;
    if (transport === null || !transport.isOpen) {
      setError("尚未連線 BK880，請先按下「選擇並連線 BK880」。");
      return;
    }

    setIsBusy(true);
    setError("");
    setSettingsStatus("正在套用設定並量測…");
    try {
      const service = new BK880ScpiService(transport);
      const result = await service.configureAndFetch(configuration);
      setReading(result.reading);
      setSettingsStatus(
        `LabVIEW 相容流程已送出：${result.settings.primary}/${result.settings.secondary}、${result.settings.frequency}、${result.settings.toleranceState}、Range ${result.settings.toleranceRange}`,
      );
    } catch (caught) {
      setError(toMessage(caught));
      setSettingsStatus("量測未完成；請檢查錯誤訊息與儀器狀態。");
      if (!transport.isOpen) {
        setIsConnected(false);
        setConnectionStatus("連線已關閉");
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-[0_25px_80px_rgba(71,85,105,0.16)] backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-200/60 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 grid gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-indigo-500">BK PRECISION 880 · WEB SERIAL API</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">BK880 瀏覽器量測介面</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              透過 Chrome／Edge 的 Web Serial API 直接連線 BK880 / LCR-615。
              請先關閉 Python、LabVIEW 或其他正在占用同一個 COM 埠的程式。
            </p>
          </div>
          <span className={`w-fit rounded-full px-4 py-2 text-xs font-black ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {isConnected ? "● 已連線" : "○ 未連線"}
          </span>
        </header>

        {!isSupported && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-amber-800" role="alert">
            此瀏覽器沒有 Web Serial API。請改用最新版 Chrome 或 Microsoft Edge，並從 localhost 或 HTTPS 網站開啟本頁。
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white bg-white/70 p-5 shadow-sm" aria-labelledby="bk880-connection-title">
            <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">01 · CONNECTION</p>
            <h2 id="bk880-connection-title" className="mt-2 text-xl font-black text-slate-800">連線控制</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                onClick={() => void connect()}
                disabled={!isSupported || isBusy || isConnected}
              >
                選擇並連線 BK880
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:text-slate-300"
                onClick={() => void disconnect()}
                disabled={isBusy || !isConnected}
              >
                中斷連線
              </button>
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs font-bold text-slate-400">連線狀態</dt>
                <dd className="mt-1 break-words font-semibold text-slate-700">{connectionStatus}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs font-bold text-slate-400">儀器識別</dt>
                <dd className="mt-1 break-words font-mono text-xs text-slate-700">{instrumentInfo}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-white bg-white/70 p-5 shadow-sm" aria-labelledby="bk880-setting-title">
            <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">02 · CONFIGURATION · LABVIEW MODE</p>
            <h2 id="bk880-setting-title" className="mt-2 text-xl font-black text-slate-800">量測設定</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              頻率會直接寫入但不讀回查詢；Tolerance 狀態沿用儀器面板，本頁只寫入 Tolerance Range。
            </p>

            <fieldset className="mt-5" disabled={!isConnected || isBusy}>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectBox label="主參數" value={configuration.primary} onChange={(value) => updatePrimary(value as PrimaryParameter)} options={PRIMARY_PARAMETERS.map((value) => ({ value, label: value }))} />
                <SelectBox
                  label="次參數"
                  value={configuration.secondary}
                  onChange={(value) => setConfiguration((current) => ({ ...current, secondary: value as SecondaryParameter }))}
                  options={SECONDARY_PARAMETERS.map((value) => ({ value, label: value }))}
                />
                <SelectBox
                  label="頻率"
                  value={String(configuration.frequency)}
                  onChange={(value) => setConfiguration((current) => ({ ...current, frequency: Number(value) as BK880Configuration["frequency"] }))}
                  options={FREQUENCIES.map((value) => ({ value: String(value), label: formatFrequency(value) }))}
                />
                <SelectBox
                  label="Tolerance 範圍"
                  value={String(configuration.toleranceRange)}
                  onChange={(value) => setConfiguration((current) => ({ ...current, toleranceRange: Number(value) as ToleranceRange }))}
                  options={TOLERANCE_RANGES.map((value) => ({ value: String(value), label: `${value}%` }))}
                />
              </div>
            </fieldset>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                onClick={() => void configureAndMeasure()}
                disabled={!isConnected || isBusy}
              >
                {isBusy ? "通訊處理中…" : "套用設定並量測"}
              </button>
              <p className="text-sm leading-7 text-slate-500">{settingsStatus}</p>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-white bg-white/70 p-5 shadow-sm" aria-labelledby="bk880-result-title" aria-busy={isBusy}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">03 · RESULT</p>
              <h2 id="bk880-result-title" className="mt-2 text-xl font-black text-slate-800">單次量測結果</h2>
            </div>
            {isBusy && <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">● 量測中</span>}
          </div>

          {reading === null ? (
            <p className="mt-5 rounded-2xl bg-slate-50/80 p-5 text-sm leading-7 text-slate-500">
              尚無量測資料。完成連線後，設定參數並按下「套用設定並量測」。
            </p>
          ) : (
            <>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <ReadingCard title={`主量測值 ${reading.primaryParameter}`} value={reading.primaryValue.toExponential(6)} detail={formatEngineering(reading.primaryValue, reading.primaryParameter)} />
                <ReadingCard title={`次量測值 ${reading.secondaryParameter}`} value={reading.secondaryValue.toExponential(6)} detail={formatEngineering(reading.secondaryValue, reading.secondaryParameter)} />
                <ReadingCard title="Tolerance BIN" value={reading.binResult} detail={reading.timestamp.toLocaleString("zh-TW", { hour12: false })} />
              </div>
              <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-slate-100">
                <p className="text-xs font-bold tracking-[0.12em] text-slate-400">第二次 FETCH? 原始回覆</p>
                <code className="mt-2 block overflow-x-auto font-mono text-sm text-emerald-200">{reading.rawResponse}</code>
              </div>
            </>
          )}
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm leading-7 text-rose-700" role="alert">
            <strong>錯誤：</strong>{error}
          </div>
        )}

        <footer className="text-center text-xs leading-6 text-slate-400">
          序列埠權限由瀏覽器管理；網站不會強制指定 Windows COM 號碼。正式部署時請使用 HTTPS 網址開啟。
        </footer>
      </div>
    </section>
  );
}

interface SelectBoxProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

/** 共用下拉選單，讓 BK880 設定欄位保持一致的玻璃亮面視覺。 */
function SelectBox({ label, value, options, onChange }: SelectBoxProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ReadingCardProps {
  title: string;
  value: string;
  detail: string;
}

/** 單一量測結果卡片，分離顯示原始科學記號值與工程單位換算結果。 */
function ReadingCard({ title, value, detail }: ReadingCardProps) {
  return (
    <article className="rounded-2xl bg-slate-50/90 p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-400">{title}</p>
      <strong className="mt-2 block break-words font-mono text-2xl text-slate-900">{value}</strong>
      <small className="mt-2 block break-words font-mono text-sm text-indigo-500">{detail}</small>
    </article>
  );
}

/** 將頻率數字顯示成操作人員習慣的單位。 */
function formatFrequency(value: number): string {
  return value >= 1_000 ? `${value / 1_000} kHz` : `${value} Hz`;
}

/** 將未知例外安全轉成可顯示的文字。 */
function toMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}


