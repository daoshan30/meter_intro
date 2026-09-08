import {
  BK880Error,
  type AppliedSettings,
  type BK880Configuration,
  type BK880Reading,
} from "./models";
import type { ScpiTransport } from "./webSerialPort";

/** 與已實機驗證的 bk880_ui_v3.py 相同的設定與兩次 FETCH? 間隔，單位為毫秒。 */
const LABVIEW_SETTLE_MS = 100;

/** 非同步等待工具；只用在儀器切換量測模式的必要位置。 */
function waitForInstrument(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, LABVIEW_SETTLE_MS));
}
/**
 * 判斷回覆是否為切換設定後常見的暫態無效值。
 * `+inf`／`-inf` 與 `----` 均不能作為量測結果，但可能是第一個 FETCH? 的舊週期資料；
 * 因此上層可補送一次 FETCH? 取得較新的資料，而不是立刻把它當成最終量測失敗。
 */
export function isTransientInvalidFetchResponse(response: string): boolean {
  const fields = response.trim().split(",").map((field) => field.trim());
  if (fields.length < 2) {
    return false;
  }
  return fields.slice(0, 2).some((field) =>
    field.includes("----") || /^[+-]?(?:inf|infinity)$/i.test(field),
  );
}

/**
 * 解析 LabVIEW 相容流程最終讀取到的三欄 FETCh? 回覆：主值、次值、Tolerance/BIN。
 * 若儀器正在量測、超出範圍或格式不是數字，立即保留原始資料並回報可讀錯誤。
 */
export function parseFetchResponse(
  response: string,
  configuration: Pick<BK880Configuration, "primary" | "secondary">,
  timestamp = new Date(),
): BK880Reading {
  const raw = response.trim();
  const fields = raw.split(",").map((field) => field.trim());
  if (fields.length !== 3) {
    throw new BK880Error(`FETCh? 回覆欄位錯誤：預期 3 欄，收到 ${fields.length} 欄：${raw}`);
  }
  if (fields.slice(0, 2).some((field) => field === "" || field.includes("----"))) {
    throw new BK880Error(`量測超出範圍或暫無有效資料：${raw}`);
  }
  if (fields[2] === "") {
    throw new BK880Error(`FETCh? 回覆缺少 Tolerance/BIN 結果：${raw}`);
  }

  const primaryValue = Number(fields[0]);
  const secondaryValue = Number(fields[1]);
  if (!Number.isFinite(primaryValue) || !Number.isFinite(secondaryValue)) {
    throw new BK880Error(`FETCh? 回覆不是有效數字：${raw}`);
  }

  return {
    primaryParameter: configuration.primary,
    secondaryParameter: configuration.secondary,
    primaryValue,
    secondaryValue,
    binResult: fields[2],
    rawResponse: raw,
    timestamp,
  };
}

/**
 * BK880 的 LabVIEW 相容 SCPI 服務。
 *
 * 現場測試已知 `FUNCTION:IMPA?`、`FUNCTION:IMPB?`、`FREQUENCY?` 等設定回讀
 * 可能沒有回覆。因此此類別刻意不將設定查詢作為阻擋條件，而是忠實移植
 * bk880_ui_v3.py 的 LF、100 ms 等待與雙 FETCH? 流程；本版額外支援只寫入頻率、不讀回。
 */
export class BK880ScpiService {
  private readonly transport: ScpiTransport;

  public constructor(transport: ScpiTransport) {
    this.transport = transport;
  }

  /** 讀取儀器識別字串；此命令與設定回讀不同，僅於剛連線後執行一次。 */
  public identify(): Promise<string> {
    return this.transport.query("*IDN?");
  }

  /**
   * 以 LabVIEW 相容節奏套用主／次參數、頻率與 Tolerance Range。
   *
   * frequency 會以 `FREQUENCY <Hz>` 直接寫入，卻刻意不發出 `FREQUENCY?` 讀回；
   * toleranceEnabled 仍僅保留 UI 相容性，Tolerance State 沿用儀器面板狀態。
   * 這樣可設定頻率，同時避開已知會逾時的設定回讀查詢。
   */
  public async configure(configuration: BK880Configuration): Promise<AppliedSettings> {
    const { primary, secondary, frequency, toleranceRange } = configuration;
    await this.transport.writeLine(`FUNCTION:IMPA ${primary}`);
    await waitForInstrument();
    await this.transport.writeLine(`FUNCTION:IMPB ${secondary}`);
    await waitForInstrument();
    // 寫入本次 UI 選擇的頻率，但不查詢 FREQUENCY?，避免已知的回讀逾時。
    await this.transport.writeLine(`FREQUENCY ${frequency}`);
    await waitForInstrument();
    await this.transport.writeLine(`CALCULATE:TOLERANCE:RANGE ${toleranceRange}`);

    return {
      primary,
      secondary,
      frequency: `已送出 ${frequency} Hz（未讀回驗證）`,
      toleranceState: "LabVIEW 相容：沿用面板狀態，僅寫入 Range",
      toleranceRange: `${toleranceRange}%`,
    };
  }

  /**
   * 依成功的 LabVIEW 通訊順序量測：第一次 FETCH? 只寫入不讀取，等待 100 ms 後
   * 寫入第二次 FETCH?，最後讀取一筆回覆。若該回覆仍是 `+inf` 或 `----` 的暫態
   * 資料，會忽略它、等待 100 ms、補送第三次 FETCH?，並改採下一筆回覆。
   */
  public async fetch(configuration: BK880Configuration): Promise<BK880Reading> {
    await this.transport.writeLine("FETCH?");
    await waitForInstrument();
    await this.transport.writeLine("FETCH?");
    let response = await this.transport.readLine("兩次 FETCH? 後的最終回覆");

    if (isTransientInvalidFetchResponse(response)) {
      // 剛切換參數／頻率時，第一個可讀回覆可能仍是尚未穩定的暫態資料。
      // 只補讀一次，避免在硬體真正超出範圍時無限制重試而掩蓋問題。
      await waitForInstrument();
      await this.transport.writeLine("FETCH?");
      response = await this.transport.readLine("暫態 FETCH? 無效值後的補讀回覆");
    }

    return parseFetchResponse(response, configuration);
  }

  /** 先送出相容設定，再以雙 FETCH? 讀取一筆穩定量測值。 */
  public async configureAndFetch(configuration: BK880Configuration): Promise<{
    settings: AppliedSettings;
    reading: BK880Reading;
  }> {
    const settings = await this.configure(configuration);
    const reading = await this.fetch(configuration);
    return { settings, reading };
  }
}
