import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const SUPPORTED_ANALYTICS_PATHS = ["/", "/bk880"] as const;

export type SupportedAnalyticsPath = (typeof SUPPORTED_ANALYTICS_PATHS)[number];

export type AnalyticsEventType =
  | "page_view"
  | "download_click"
  | "download_granted"
  | "download_denied"
  | "license_activate"
  | "payment_success";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_PATH"
  | "INVALID_EVENT_TYPE"
  | "FEATURE_NOT_ENABLED"
  | "STORE_ERROR";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  error: null;
}

export interface ApiFailure {
  ok: false;
  data: null;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface PageViewTotal {
  path: SupportedAnalyticsPath;
  count: number;
  updatedAt: string;
}

export interface SiteEvent {
  id: string;
  eventType: AnalyticsEventType;
  path: SupportedAnalyticsPath;
  idempotencyKey?: string;
  ipHash?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface AnalyticsDataFile {
  schemaVersion: 1;
  pageViewTotals: Record<SupportedAnalyticsPath, PageViewTotal>;
  siteEvents: SiteEvent[];
}

export interface RecordPageViewInput {
  path: SupportedAnalyticsPath;
  idempotencyKey?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface RecordPageViewResult {
  eventType: "page_view";
  path: SupportedAnalyticsPath;
  count: number;
  duplicated: boolean;
  updatedAt: string;
}

const MAX_EVENT_HISTORY = 5000;

const defaultTotals: Record<SupportedAnalyticsPath, PageViewTotal> = {
  "/": {
    path: "/",
    count: 0,
    updatedAt: new Date(0).toISOString(),
  },
  "/bk880": {
    path: "/bk880",
    count: 0,
    updatedAt: new Date(0).toISOString(),
  },
};

/**
 * 第一版使用 JSON 檔案作為可持久化的簡易儲存層。
 *
 * 設計重點：
 * - localhost 可直接練習後台 API 與資料寫入流程。
 * - 部署到 Linode VPS 時，可用 ANALYTICS_DATA_FILE 指向 /var/lib 之類的持久化路徑。
 * - 未來若改成 SQLite / PostgreSQL，只要保留這個 store 的 public function 介面即可替換。
 */
const analyticsDataFile =
  process.env.ANALYTICS_DATA_FILE ??
  path.join(process.cwd(), ".data", "site-analytics.json");

let writeQueue: Promise<void> = Promise.resolve();

export function isSupportedAnalyticsPath(value: unknown): value is SupportedAnalyticsPath {
  return (
    typeof value === "string" &&
    SUPPORTED_ANALYTICS_PATHS.includes(value as SupportedAnalyticsPath)
  );
}

export function isSupportedEventType(value: unknown): value is AnalyticsEventType {
  return (
    value === "page_view" ||
    value === "download_click" ||
    value === "download_granted" ||
    value === "download_denied" ||
    value === "license_activate" ||
    value === "payment_success"
  );
}

export function createSuccess<T>(data: T): ApiSuccess<T> {
  return {
    ok: true,
    data,
    error: null,
  };
}

export function createFailure(code: ApiErrorCode, message: string): ApiFailure {
  return {
    ok: false,
    data: null,
    error: {
      code,
      message,
    },
  };
}

export async function getPageViewTotal(
  pagePath: SupportedAnalyticsPath,
): Promise<PageViewTotal> {
  const data = await readAnalyticsData();
  return data.pageViewTotals[pagePath] ?? defaultTotals[pagePath];
}

export async function getRecentEvents(limit = 50): Promise<SiteEvent[]> {
  const data = await readAnalyticsData();
  return data.siteEvents.slice(-limit).reverse();
}

export async function recordPageView(
  input: RecordPageViewInput,
): Promise<RecordPageViewResult> {
  return enqueueWrite(async () => {
    const data = await readAnalyticsData();
    const now = new Date().toISOString();

    const isDuplicated =
      Boolean(input.idempotencyKey) &&
      data.siteEvents.some(
        (event) =>
          event.eventType === "page_view" &&
          event.path === input.path &&
          event.idempotencyKey === input.idempotencyKey,
      );

    if (!isDuplicated) {
      const currentTotal = data.pageViewTotals[input.path] ?? defaultTotals[input.path];
      const nextTotal: PageViewTotal = {
        path: input.path,
        count: currentTotal.count + 1,
        updatedAt: now,
      };

      data.pageViewTotals[input.path] = nextTotal;
      data.siteEvents.push({
        id: crypto.randomUUID(),
        eventType: "page_view",
        path: input.path,
        idempotencyKey: input.idempotencyKey,
        ipHash: hashIp(input.ipAddress),
        userAgent: input.userAgent ?? undefined,
        createdAt: now,
      });

      if (data.siteEvents.length > MAX_EVENT_HISTORY) {
        data.siteEvents = data.siteEvents.slice(-MAX_EVENT_HISTORY);
      }

      await writeAnalyticsData(data);

      return {
        eventType: "page_view",
        path: input.path,
        count: nextTotal.count,
        duplicated: false,
        updatedAt: nextTotal.updatedAt,
      };
    }

    const total = data.pageViewTotals[input.path] ?? defaultTotals[input.path];
    return {
      eventType: "page_view",
      path: input.path,
      count: total.count,
      duplicated: true,
      updatedAt: total.updatedAt,
    };
  });
}

export function getAnalyticsStorageInfo() {
  return {
    driver: "json-file",
    dataFile: analyticsDataFile,
  };
}

async function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(operation, operation);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readAnalyticsData(): Promise<AnalyticsDataFile> {
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ analyticsDataFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<AnalyticsDataFile>;

    return normalizeAnalyticsData(parsed);
  } catch (error) {
    if (isNodeFileNotFoundError(error)) {
      return createInitialAnalyticsData();
    }

    throw error;
  }
}

async function writeAnalyticsData(data: AnalyticsDataFile): Promise<void> {
  await fs.mkdir(path.dirname(analyticsDataFile), { recursive: true });
  await fs.writeFile(
    /*turbopackIgnore: true*/ analyticsDataFile,
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

function createInitialAnalyticsData(): AnalyticsDataFile {
  return {
    schemaVersion: 1,
    pageViewTotals: structuredClone(defaultTotals),
    siteEvents: [],
  };
}

function normalizeAnalyticsData(parsed: Partial<AnalyticsDataFile>): AnalyticsDataFile {
  return {
    schemaVersion: 1,
    pageViewTotals: {
      "/": parsed.pageViewTotals?.["/"] ?? defaultTotals["/"],
      "/bk880": parsed.pageViewTotals?.["/bk880"] ?? defaultTotals["/bk880"],
    },
    siteEvents: Array.isArray(parsed.siteEvents) ? parsed.siteEvents : [],
  };
}

function hashIp(ipAddress?: string | null): string | undefined {
  if (!ipAddress) {
    return undefined;
  }

  const firstIp = ipAddress.split(",")[0]?.trim();

  if (!firstIp) {
    return undefined;
  }

  const salt = process.env.ANALYTICS_HASH_SALT ?? "meter-intro-development-salt";
  return crypto.createHash("sha256").update(`${salt}:${firstIp}`).digest("hex");
}

function isNodeFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
