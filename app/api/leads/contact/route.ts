import type { NextRequest } from "next/server";
import { createContactLead } from "@/lib/downloads/downloadStore";
import { createCorsPreflightResponse, jsonWithCors } from "@/lib/api/cors";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 100;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SOURCE_PATH_LENGTH = 512;

type ContactRequestBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  sourcePath?: unknown;
  website?: unknown;
};

export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}

/**
 * 儲存首頁「聯絡我們」表單。
 * 這個端點只接受經過基本格式檢查的文字；實際資料寫入 Linode 的 SQLite，
 * 不會將聯絡資料保存在 Vercel 或瀏覽器端。
 */
export async function POST(request: NextRequest) {
  let body: ContactRequestBody;

  try {
    body = (await request.json()) as ContactRequestBody;
  } catch {
    return errorResponse(request, "INVALID_JSON", "請確認送出的資料格式是否正確。");
  }

  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email).toLowerCase();
  const message = asTrimmedString(body.message);
  const sourcePath = normalizeSourcePath(body.sourcePath);

  // 隱藏欄位不是給真人填寫的；若機器人填入，回傳成功但不寫入資料庫，
  // 避免讓垃圾訊息來源藉由回應差異調整攻擊方式。
  if (asTrimmedString(body.website)) {
    return jsonWithCors(request, {
      ok: true,
      data: { received: true },
      error: null,
    });
  }

  if (name.length > MAX_NAME_LENGTH) {
    return errorResponse(request, "INVALID_NAME", `姓名請勿超過 ${MAX_NAME_LENGTH} 個字元。`);
  }

  if (!isValidEmail(email)) {
    return errorResponse(request, "INVALID_EMAIL", "請輸入有效的 Email。", 400);
  }

  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse(
      request,
      "INVALID_MESSAGE",
      `留言內容請輸入 ${MIN_MESSAGE_LENGTH} 到 ${MAX_MESSAGE_LENGTH} 個字元。`,
      400,
    );
  }

  try {
    const data = await createContactLead({
      name,
      email,
      message,
      sourcePath,
      userAgent: request.headers.get("user-agent"),
      ipAddress:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        null,
    });

    return jsonWithCors(request, {
      ok: true,
      data,
      error: null,
    });
  } catch (error) {
    return errorResponse(
      request,
      "STORE_ERROR",
      error instanceof Error ? error.message : "送出失敗，請稍後再試。",
      500,
    );
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSourcePath(value: unknown): string {
  const sourcePath = asTrimmedString(value);

  if (
    !sourcePath ||
    sourcePath.length > MAX_SOURCE_PATH_LENGTH ||
    !sourcePath.startsWith("/") ||
    sourcePath.startsWith("//")
  ) {
    return "/";
  }

  return sourcePath;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function errorResponse(
  request: NextRequest,
  code: string,
  message: string,
  status = 400,
) {
  return jsonWithCors(
    request,
    {
      ok: false,
      data: null,
      error: { code, message },
    },
    { status },
  );
}
