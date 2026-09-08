/**
 * BK880 Web Serial 應用程式共用的資料型別與常數。
 * 這些型別刻意與 Python 基礎程式 bk880_ui.py 的可設定範圍一致，
 * 讓 UI、SCPI 服務與測試使用同一個明確的契約。
 */

/** BK880 可用的主量測參數。 */
export const PRIMARY_PARAMETERS = ["C", "R", "Z", "L"] as const;
export type PrimaryParameter = (typeof PRIMARY_PARAMETERS)[number];

/** BK880 可用的次量測參數。 */
export const SECONDARY_PARAMETERS = ["D", "Q", "THETA"] as const;
export type SecondaryParameter = (typeof SECONDARY_PARAMETERS)[number];

/** 與基本 Python 程式相同的可選頻率，單位為 Hz。 */
export const FREQUENCIES = [100, 1_000, 10_000, 100_000] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/** Tolerance 可選百分比範圍。 */
export const TOLERANCE_RANGES = [1, 5, 10, 20] as const;
export type ToleranceRange = (typeof TOLERANCE_RANGES)[number];

/** 主參數變更時 UI 建議帶入的次參數。 */
export const DEFAULT_SECONDARY: Record<PrimaryParameter, SecondaryParameter> = {
  C: "D",
  R: "THETA",
  Z: "THETA",
  L: "Q",
};

/** 使用者在畫面上選擇、準備套用至儀器的設定。 */
export interface BK880Configuration {
  primary: PrimaryParameter;
  secondary: SecondaryParameter;
  frequency: Frequency;
  toleranceEnabled: boolean;
  toleranceRange: ToleranceRange;
}

/** SCPI 設定後由儀器讀回並驗證的實際設定。 */
export interface AppliedSettings {
  primary: string;
  secondary: string;
  frequency: string;
  toleranceState: string;
  toleranceRange: string;
}

/** 一筆由第二次 FETCh? 回覆解析出的量測資料。 */
export interface BK880Reading {
  primaryParameter: PrimaryParameter;
  secondaryParameter: SecondaryParameter;
  primaryValue: number;
  secondaryValue: number;
  binResult: string;
  rawResponse: string;
  timestamp: Date;
}

/** 供 UI 顯示的通訊錯誤；訊息已可直接提供給操作人員。 */
export class BK880Error extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "BK880Error";
  }
}

/** 代表連線、讀寫、逾時或裝置拔除等需要重新連線的錯誤。 */
export class BK880ConnectionError extends BK880Error {
  public constructor(message: string) {
    super(message);
    this.name = "BK880ConnectionError";
  }
}