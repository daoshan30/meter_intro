"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ContactModalProps = {
  className: string;
  label?: string;
};

type ContactResponse = {
  ok: boolean;
  data: null | {
    received: boolean;
  };
  error: null | {
    message: string;
  };
};

/**
 * 首頁聯絡表單的獨立 Client Component。
 * Modal 與表單狀態只留在瀏覽器記憶體，送出時才將必要欄位 POST 到 Linode API。
 */
export function ContactModal({ className, label = "聯絡我們" }: ContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  // 此計時器僅在瀏覽器端 Client Component 使用；瀏覽器 window.setTimeout 回傳數字 id。
  const autoCloseTimerRef = useRef<number | null>(null);

  function clearAutoCloseTimer() {
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }

  useEffect(() => () => clearAutoCloseTimer(), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && status !== "submitting") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, status]);

  function closeModal() {
    if (status !== "submitting") {
      clearAutoCloseTimer();
      setIsOpen(false);
      setStatus("idle");
      setStatusMessage("");
    }
  }

  function openModal() {
    clearAutoCloseTimer();
    setStatus("idle");
    setStatusMessage("");
    setIsOpen(true);
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setStatusMessage("");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${apiBaseUrl}/api/leads/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          sourcePath: "/",
          website: honeypot,
        }),
      });
      const payload = (await response.json()) as ContactResponse;

      if (!response.ok || !payload.ok || !payload.data?.received) {
        throw new Error(payload.error?.message ?? "送出失敗，請稍後再試。");
      }

      setName("");
      setEmail("");
      setMessage("");
      setHoneypot("");
      setStatus("success");
      setStatusMessage("已收到您的留言，我們會盡快回覆。");
      // 讓成功訊息停留一下，使用者確認送出成功後再自動關閉 Modal。
      clearAutoCloseTimer();
      autoCloseTimerRef.current = window.setTimeout(() => {
        autoCloseTimerRef.current = null;
        setIsOpen(false);
        setStatus("idle");
        setStatusMessage("");
      }, 1600);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={openModal}>
        {label}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/80 bg-[#f8fbff] p-6 shadow-2xl shadow-slate-900/30 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Contact</p>
                <h2 id="contact-modal-title" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  聯絡我們
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">留下您的問題，我們會盡快回覆。</p>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={closeModal}
                disabled={status === "submitting"}
                aria-label="關閉聯絡表單"
              >
                ×
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submitContact}>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">姓名（選填）</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="您的姓名"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">留言內容</span>
                <textarea
                  className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  required
                  minLength={10}
                  maxLength={2000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="請告訴我們您的需求或問題（至少 10 個字元）"
                />
              </label>

              <label className="hidden" aria-hidden="true">
                網站
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </label>

              <p className="text-xs leading-6 text-slate-400">資料僅用於回覆本次詢問，不會儲存在您的瀏覽器中。</p>

              <button
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "送出中..." : "送出留言"}
              </button>
            </form>

            {statusMessage ? (
              <p
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  status === "success"
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border border-rose-100 bg-rose-50 text-rose-700"
                }`}
                role="status"
              >
                {statusMessage}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
