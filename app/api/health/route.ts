import { createSuccess, getAnalyticsStorageInfo } from "@/lib/analytics/analyticsStore";
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
    createSuccess({
      service: "meter-intro-backend",
      status: "ok",
      checkedAt: new Date().toISOString(),
      analyticsStorage: {
        driver: getAnalyticsStorageInfo().driver,
      },
    }),
  );
}
