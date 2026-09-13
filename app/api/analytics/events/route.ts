import {
  createFailure,
  createSuccess,
  isSupportedAnalyticsPath,
  isSupportedEventType,
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
  return jsonWithCors(
    request,
    createFailure(
      "FEATURE_NOT_ENABLED",
      "通用事件查詢端點已預留，但第一版尚未開放公開查詢。",
    ),
    { status: 501 },
  );
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

  const eventType =
    typeof payload === "object" && payload !== null && "eventType" in payload
      ? payload.eventType
      : undefined;
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

  if (!isSupportedEventType(eventType)) {
    return jsonWithCors(
      request,
      createFailure("INVALID_EVENT_TYPE", "不支援的事件類型。"),
      { status: 400 },
    );
  }

  if (!isSupportedAnalyticsPath(pagePath)) {
    return jsonWithCors(
      request,
      createFailure("INVALID_PATH", "不支援的頁面路徑。"),
      { status: 400 },
    );
  }

  if (eventType !== "page_view") {
    return jsonWithCors(
      request,
      createFailure("INVALID_EVENT_TYPE", "第一版目前只開放 page_view 事件。"),
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
      createFailure("STORE_ERROR", "後台事件紀錄寫入失敗。"),
      { status: 500 },
    );
  }
}
