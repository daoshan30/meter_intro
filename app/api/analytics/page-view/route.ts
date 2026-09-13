import {
  createFailure,
  createSuccess,
  getPageViewTotal,
  isSupportedAnalyticsPath,
  recordPageView,
} from "@/lib/analytics/analyticsStore";
import { createCorsPreflightResponse, jsonWithCors } from "@/lib/api/cors";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}

export async function GET(request: NextRequest) {
  const pagePath = request.nextUrl.searchParams.get("path");

  if (!isSupportedAnalyticsPath(pagePath)) {
    return jsonWithCors(
      request,
      createFailure("INVALID_PATH", "不支援的頁面路徑。"),
      { status: 400 },
    );
  }

  const total = await getPageViewTotal(pagePath);
  return jsonWithCors(request, createSuccess(total));
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonWithCors(
      request,
      createFailure("INVALID_JSON", "請求內容不是有效的 JSON。"),
      { status: 400 },
    );
  }

  const pagePath =
    typeof payload === "object" && payload !== null && "path" in payload
      ? payload.path
      : undefined;
  const idempotencyKey =
    typeof payload === "object" &&
    payload !== null &&
    "idempotencyKey" in payload &&
    typeof payload.idempotencyKey === "string"
      ? payload.idempotencyKey
      : undefined;

  if (!isSupportedAnalyticsPath(pagePath)) {
    return jsonWithCors(
      request,
      createFailure("INVALID_PATH", "不支援的頁面路徑。"),
      { status: 400 },
    );
  }

  try {
    const result = await recordPageView({
      path: pagePath,
      idempotencyKey,
      userAgent: request.headers.get("user-agent"),
      ipAddress:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip"),
    });

    return jsonWithCors(request, createSuccess(result));
  } catch {
    return jsonWithCors(
      request,
      createFailure("STORE_ERROR", "後台瀏覽紀錄寫入失敗。"),
      { status: 500 },
    );
  }
}
