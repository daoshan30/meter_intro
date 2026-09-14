import type { NextRequest } from "next/server";
import {
  createDownloadRequest,
  isSupportedDownloadProduct,
  isSupportedRelease,
} from "@/lib/downloads/downloadStore";
import { createCorsPreflightResponse, jsonWithCors } from "@/lib/api/cors";

export const runtime = "nodejs";

type DownloadRequestBody = {
  productKey?: unknown;
  releaseKey?: unknown;
  email?: unknown;
  sourcePath?: unknown;
};

export function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request);
}

export async function POST(request: NextRequest) {
  let body: DownloadRequestBody;

  try {
    body = (await request.json()) as DownloadRequestBody;
  } catch {
    return jsonWithCors(
      request,
      {
        ok: false,
        data: null,
        error: {
          code: "INVALID_JSON",
          message: "請確認送出的資料格式是否正確。",
        },
      },
      { status: 400 },
    );
  }

  const productKey = typeof body.productKey === "string" ? body.productKey.trim() : "";
  const releaseKey = typeof body.releaseKey === "string" ? body.releaseKey.trim() : undefined;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const sourcePath = typeof body.sourcePath === "string" ? body.sourcePath.trim() : "/downloads/bk880";

  if (!isSupportedDownloadProduct(productKey)) {
    return jsonWithCors(
      request,
      {
        ok: false,
        data: null,
        error: {
          code: "INVALID_PRODUCT",
          message: "找不到指定的下載項目。",
        },
      },
      { status: 400 },
    );
  }

  if (!isSupportedRelease(releaseKey)) {
    return jsonWithCors(
      request,
      {
        ok: false,
        data: null,
        error: {
          code: "INVALID_RELEASE",
          message: "找不到指定的版本。",
        },
      },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return jsonWithCors(
      request,
      {
        ok: false,
        data: null,
        error: {
          code: "INVALID_EMAIL",
          message: "請輸入有效的 Email。",
        },
      },
      { status: 400 },
    );
  }

  try {
    const data = await createDownloadRequest({
      productKey,
      releaseKey,
      email,
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
    return jsonWithCors(
      request,
      {
        ok: false,
        data: null,
        error: {
          code: "STORE_ERROR",
          message: error instanceof Error ? error.message : "下載請求儲存失敗，請稍後再試。",
        },
      },
      { status: 500 },
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
