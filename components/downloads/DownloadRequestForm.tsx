"use client";

import { FormEvent, useState } from "react";

type DownloadResponse = {
  ok: boolean;
  data: null | {
    downloadRequestId: number;
    downloadUrl: string;
    checksumSha256: string;
  };
  error: null | {
    message: string;
  };
};

const productKey = "bk880-v3-1-usb-com-csv-logger";

export function DownloadRequestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setDownloadUrl("");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBaseUrl}/api/downloads/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productKey,
          releaseKey: "v3.1",
          email,
          sourcePath: "/downloads/bk880",
        }),
      });
      const payload = (await response.json()) as DownloadResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "送出失敗，請稍後再試。");
      }

      setStatus("success");
      setMessage("已記錄您的 Email，請點擊下方按鈕下載。");
      setDownloadUrl(payload.data.downloadUrl);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-[0_24px_70px_rgba(71,85,105,0.16)] backdrop-blur-2xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">
          Free Download
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
          取得免費下載連結
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          請留下 Email，系統會記錄下載請求後顯示 Google Drive 下載按鈕。
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Email</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <button
          className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "送出中..." : "取得下載連結"}
        </button>
      </form>

      {message ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
            status === "success"
              ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border border-rose-100 bg-rose-50 text-rose-700"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      {downloadUrl ? (
        <a
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-indigo-100 bg-white px-5 py-3 text-sm font-black text-indigo-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50"
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
        >
          下載
        </a>
      ) : null}
    </div>
  );
}
