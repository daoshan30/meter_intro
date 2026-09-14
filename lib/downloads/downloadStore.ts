import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

const PRODUCT_KEY = "bk880-v3-1-usb-com-csv-logger";
const RELEASE_KEY = "v3.1";
const DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1xME-r9kocwzgo8vNYWRoxKBq3tKj9rpW";
const DOWNLOAD_FILE_SHA256 =
  "BA1421E37FB60990BD23CB1307AF3327F5EA28EC0106019E91DDF6E59C8D84B5";

const databaseFile =
  process.env.METER_INTRO_DB_FILE ??
  process.env.LEADS_DB_FILE ??
  path.join(process.cwd(), ".data", "meter-intro.sqlite");

interface SqliteModule {
  DatabaseSync: new (filename: string) => {
    exec(sql: string): void;
    prepare(sql: string): {
      get(...params: unknown[]): unknown;
      run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
    };
  };
}

interface ProductRow {
  id: number;
  product_key: string;
}

interface ReleaseRow {
  id: number;
  release_key: string;
}

export interface CreateDownloadRequestInput {
  productKey: string;
  releaseKey?: string;
  email: string;
  sourcePath?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CreateDownloadRequestResult {
  downloadRequestId: number;
  productKey: string;
  releaseKey: string;
  downloadUrl: string;
  checksumSha256: string;
  createdAt: string;
}

export interface CreateContactLeadInput {
  name?: string;
  email: string;
  message: string;
  sourcePath?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CreateContactLeadResult {
  leadId: number;
  received: true;
  receivedAt: string;
}

let databasePromise: Promise<InstanceType<SqliteModule["DatabaseSync"]>> | undefined;

export function isSupportedDownloadProduct(productKey: string): boolean {
  return productKey === PRODUCT_KEY;
}

export function isSupportedRelease(releaseKey?: string): boolean {
  return !releaseKey || releaseKey === RELEASE_KEY || releaseKey === "latest";
}

export function getDownloadStorageInfo() {
  return {
    driver: "sqlite",
    databaseFile,
  };
}

export async function createDownloadRequest(
  input: CreateDownloadRequestInput,
): Promise<CreateDownloadRequestResult> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const releaseKey = normalizeReleaseKey(input.releaseKey);
  const product = db
    .prepare("SELECT id, product_key FROM products WHERE product_key = ?")
    .get(input.productKey) as ProductRow | undefined;

  if (!product) {
    throw new Error(`Unsupported product key: ${input.productKey}`);
  }

  const release = db
    .prepare("SELECT id, release_key FROM releases WHERE product_id = ? AND release_key = ?")
    .get(product.id, releaseKey) as ReleaseRow | undefined;

  if (!release) {
    throw new Error(`Unsupported release key: ${releaseKey}`);
  }

  const result = db
    .prepare(
      `INSERT INTO download_requests (
        product_id,
        release_id,
        email,
        source_path,
        ip_hash,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      product.id,
      release.id,
      input.email.trim().toLowerCase(),
      input.sourcePath ?? "/downloads/bk880",
      hashIp(input.ipAddress),
      input.userAgent ?? null,
      now,
    );

  return {
    downloadRequestId: Number(result.lastInsertRowid),
    productKey: input.productKey,
    releaseKey,
    downloadUrl: DOWNLOAD_URL,
    checksumSha256: DOWNLOAD_FILE_SHA256,
    createdAt: now,
  };
}

/**
 * 將首頁聯絡表單寫入與下載紀錄共用的 SQLite 資料庫。
 * 路由層已驗證欄位格式；這裡仍統一修剪字串與限制 user agent 長度，
 * 避免瀏覽器標頭意外占用過多資料庫空間。
 */
export async function createContactLead(
  input: CreateContactLeadInput,
): Promise<CreateContactLeadResult> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO leads (
        type,
        name,
        email,
        message,
        source_path,
        ip_hash,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "contact",
      input.name?.trim() || null,
      input.email.trim().toLowerCase(),
      input.message.trim(),
      input.sourcePath ?? "/",
      hashIp(input.ipAddress),
      input.userAgent?.slice(0, 500) ?? null,
      now,
    );

  return {
    leadId: Number(result.lastInsertRowid),
    received: true,
    receivedAt: now,
  };
}

function normalizeReleaseKey(releaseKey?: string): string {
  return !releaseKey || releaseKey === "latest" ? RELEASE_KEY : releaseKey;
}

async function getDatabase(): Promise<InstanceType<SqliteModule["DatabaseSync"]>> {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function openDatabase(): Promise<InstanceType<SqliteModule["DatabaseSync"]>> {
  mkdirSync(path.dirname(databaseFile), { recursive: true });
  const sqlite = (await import("node:sqlite")) as SqliteModule;
  const db = new sqlite.DatabaseSync(databaseFile);
  initializeSchema(db);
  seedBk880Release(db);
  return db;
}

function initializeSchema(db: InstanceType<SqliteModule["DatabaseSync"]>): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      release_key TEXT NOT NULL,
      version TEXT,
      file_name TEXT,
      google_drive_url TEXT,
      checksum_sha256 TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(product_id, release_key),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS download_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      release_id INTEGER,
      email TEXT NOT NULL,
      source_path TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (release_id) REFERENCES releases(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT,
      email TEXT NOT NULL,
      message TEXT,
      source_path TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seedBk880Release(db: InstanceType<SqliteModule["DatabaseSync"]>): void {
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO products (
      product_key,
      name,
      description,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
  ).run(
    PRODUCT_KEY,
    "BK880 v3.1 USB COM CSV Logger",
    "BK880 / LCR-615 USB COM 單次量測、表格累積與 CSV 存檔工具。",
    now,
    now,
  );

  const product = db
    .prepare("SELECT id, product_key FROM products WHERE product_key = ?")
    .get(PRODUCT_KEY) as ProductRow | undefined;

  if (!product) {
    throw new Error("Failed to seed BK880 product.");
  }

  db.prepare(
    `INSERT OR IGNORE INTO releases (
      product_id,
      release_key,
      version,
      file_name,
      google_drive_url,
      checksum_sha256,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    product.id,
    RELEASE_KEY,
    "3.1",
    "BK880_v3_1_USB_COM_CSV_Logger.exe",
    DOWNLOAD_URL,
    DOWNLOAD_FILE_SHA256,
    now,
    now,
  );

  db.prepare(
    `UPDATE releases
     SET version = ?,
         file_name = ?,
         google_drive_url = ?,
         checksum_sha256 = ?,
         is_active = 1,
         updated_at = ?
     WHERE product_id = ? AND release_key = ?`,
  ).run(
    "3.1",
    "BK880_v3_1_USB_COM_CSV_Logger.exe",
    DOWNLOAD_URL,
    DOWNLOAD_FILE_SHA256,
    now,
    product.id,
    RELEASE_KEY,
  );
}

function hashIp(ipAddress?: string | null): string | null {
  if (!ipAddress) {
    return null;
  }

  const firstIp = ipAddress.split(",")[0]?.trim();

  if (!firstIp) {
    return null;
  }

  const salt = process.env.ANALYTICS_HASH_SALT ?? "meter-intro-development-salt";
  return crypto.createHash("sha256").update(`${salt}:${firstIp}`).digest("hex");
}
