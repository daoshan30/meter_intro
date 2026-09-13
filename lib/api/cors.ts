import type { NextRequest } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://meter.daoshan50.com",
];

export function createCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin");

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function createCorsPreflightResponse(request: NextRequest): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request),
  });
}

export function jsonWithCors(
  request: NextRequest,
  body: unknown,
  init: ResponseInit = {},
): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...createCorsHeaders(request),
      ...init.headers,
    },
  });
}

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN;

  if (!fromEnv) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return fromEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
