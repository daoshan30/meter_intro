"use client";

import { useEffect, useState } from "react";
import type { SupportedAnalyticsPath } from "@/lib/analytics/analyticsStore";

interface PageViewTrackerProps {
  path: SupportedAnalyticsPath;
  label: string;
  className?: string;
}

interface PageViewResponse {
  ok: boolean;
  data: {
    eventType: "page_view";
    path: SupportedAnalyticsPath;
    count: number;
    duplicated: boolean;
    updatedAt: string;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export function PageViewTracker({
  path,
  label,
  className = "",
}: PageViewTrackerProps) {
  const [count, setCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function recordPageView() {
      const idempotencyKey = createPageLoadIdempotencyKey(path);

      if (!idempotencyKey) {
        return;
      }

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
        const response = await fetch(`${apiBaseUrl}/api/analytics/page-view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path,
            idempotencyKey,
          }),
        });
        const result = (await response.json()) as PageViewResponse;

        if (!cancelled && result.ok && result.data) {
          setCount(result.data.count);
          setErrorMessage(null);
        }

        if (!cancelled && !result.ok) {
          setErrorMessage(result.error?.message ?? "瀏覽統計失敗");
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("瀏覽統計暫時無法連線");
        }
      }
    }

    recordPageView();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <p
      className={`text-xs font-semibold text-slate-400 ${className}`}
      aria-live="polite"
      title={errorMessage ?? `${label}後台瀏覽計數器`}
    >
      {label}：
      <span className="font-mono text-slate-500">
        {count === null ? "統計中" : count.toLocaleString("zh-TW")}
      </span>
    </p>
  );
}

function createPageLoadIdempotencyKey(path: SupportedAnalyticsPath): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const timeOrigin = Math.round(performance.timeOrigin || Date.now());
  const idKey = `meter-intro:page-view-id:${path}:${timeOrigin}`;

  const idempotencyKey =
    window.sessionStorage.getItem(idKey) ??
    `${path}:${timeOrigin}:${crypto.randomUUID()}`;

  window.sessionStorage.setItem(idKey, idempotencyKey);

  return idempotencyKey;
}
