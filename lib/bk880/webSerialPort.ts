import { BK880ConnectionError } from "./models";

/** Web Serial 開啟設定：與實機成功的 bk880_ui_v3.py 相同的 9600 8N1、無硬體流控。 */
const BK880_SERIAL_OPTIONS: SerialOptions = {
  baudRate: 9_600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};

/** BK880 單一 SCPI 回覆的最長等待時間，單位為毫秒。 */
const RESPONSE_TIMEOUT_MS = 3_500;

/** 將 SCPI 命令編碼為 LabVIEW 相容的 ASCII + LF 位元組，供實機寫入與單元測試共用。 */
export function encodeScpiLine(command: string): Uint8Array {
  return new TextEncoder().encode(`${command}\n`);
}

/** 讓 SCPI 服務可被實機通訊與測試替身共同實作的最小介面。 */
export interface ScpiTransport {
  writeLine(command: string): Promise<void>;
  query(command: string, timeoutMs?: number): Promise<string>;
  readLine(context: string, timeoutMs?: number): Promise<string>;
}

/**
 * Web Serial API 的通訊封裝。
 *
 * 重要設計：保持同一個 reader lock 與文字行緩衝，確保 USB 串流將資料分段傳來時，
 * 不會把半行 SCPI 回覆交給上層解析。儀器回覆可能使用 CRLF，本服務以 LF 分行並移除尾端 CR。
 */
export class WebSerialPort implements ScpiTransport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readonly decoder = new TextDecoder("ascii");
  private lineBuffer = "";
  private disconnectCallback: (() => void) | null = null;

  /** 瀏覽器是否提供 Web Serial API。 */
  public static isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator && navigator.serial !== undefined;
  }

  /** 目前是否已成功開啟序列埠。 */
  public get isOpen(): boolean {
    return this.port !== null && this.reader !== null;
  }

  /** 回傳已選裝置的資訊；Web API 不會可靠提供 Windows COM 號碼。 */
  public getPortInfo(): SerialPortInfo | null {
    return this.port?.getInfo() ?? null;
  }

  /** 設定裝置拔除時通知 UI 的回呼。 */
  public onDisconnect(callback: (() => void) | null): void {
    this.disconnectCallback = callback;
  }

  /**
   * 必須由使用者點擊事件直接呼叫，否則瀏覽器會拒絕顯示埠選擇器。
   * 成功後即以 BK880 固定串列設定打開選取的裝置。
   */
  public async requestAndOpen(): Promise<SerialPortInfo> {
    this.requireSupport();
    if (this.isOpen) {
      return this.port!.getInfo();
    }

    try {
      const selectedPort = await navigator.serial!.requestPort();
      await selectedPort.open(BK880_SERIAL_OPTIONS);
      this.port = selectedPort;
      this.reader = selectedPort.readable?.getReader() ?? null;
      if (this.reader === null) {
        await selectedPort.close();
        this.port = null;
        throw new BK880ConnectionError("瀏覽器未提供可讀取的序列資料串流。");
      }
      navigator.serial!.addEventListener("disconnect", this.handleDisconnect);
      return selectedPort.getInfo();
    } catch (error) {
      await this.close();
      throw this.normalizeConnectionError("無法開啟 BK880 序列埠", error);
    }
  }

  /**
   * 寫入一行 ASCII SCPI 命令。LabVIEW 相容模式使用 LF；故不接受已包含換行的命令，
   * 避免意外形成兩條指令或將使用者輸入直接注入儀器。
   */
  public async writeLine(command: string): Promise<void> {
    const port = this.requireOpen();
    if (/\r|\n/.test(command)) {
      throw new BK880ConnectionError("SCPI 命令不可自行包含換行字元。");
    }
    if (port.writable === null) {
      throw new BK880ConnectionError("序列埠沒有可寫入的資料串流。");
    }

    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    try {
      writer = port.writable.getWriter();
      // LCR-615 的實機穩定流程與 LabVIEW 相同，所有寫入一律僅以 LF 結尾。
      await writer.write(encodeScpiLine(command));
    } catch (error) {
      throw this.normalizeConnectionError(`SCPI 指令傳送失敗：${command}`, error);
    } finally {
      writer?.releaseLock();
    }
  }

  /** 寫入查詢命令並等待第一筆非空白的完整回覆行。 */
  public async query(command: string, timeoutMs = RESPONSE_TIMEOUT_MS): Promise<string> {
    await this.writeLine(command);
    return this.readLine(command, timeoutMs);
  }

  /**
   * 只讀取一筆已由上層送出的查詢回覆，不會額外寫入命令。
   * LabVIEW 相容的雙 FETCH? 流程必須先連續寫入兩次，再只讀取最後一筆回覆，
   * 因此不能把此行為包在 query() 中。
   */
  public async readLine(context: string, timeoutMs = RESPONSE_TIMEOUT_MS): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const line = await this.readLineWithTimeout(context, timeoutMs);
      if (line.trim() !== "") {
        return line.trim();
      }
    }
    throw new BK880ConnectionError(`等待 ${context} 回覆時收到過多空白行。`);
  }

  /** 關閉 reader lock 與序列埠；可安全重複呼叫。 */
  public async close(): Promise<void> {
    const reader = this.reader;
    const port = this.port;
    this.reader = null;
    this.port = null;
    this.lineBuffer = "";
    navigator.serial?.removeEventListener("disconnect", this.handleDisconnect);

    if (reader !== null) {
      try {
        await reader.cancel();
      } catch {
        // 裝置已拔除或串流已結束時，取消 reader 可能失敗；仍必須釋放 lock。
      }
      reader.releaseLock();
    }
    if (port !== null) {
      try {
        await port.close();
      } catch {
        // 拔除裝置後 close 可能被瀏覽器拒絕；內部狀態已清除，UI 仍可重新連線。
      }
    }
  }

  /** 讀取直到收到完整 LF 行；保留未完成字串供下次讀取接續。 */
  private async readNextLine(): Promise<string> {
    const existingLineIndex = this.lineBuffer.indexOf("\n");
    if (existingLineIndex >= 0) {
      const line = this.lineBuffer.slice(0, existingLineIndex).replace(/\r$/, "");
      this.lineBuffer = this.lineBuffer.slice(existingLineIndex + 1);
      return line;
    }

    const reader = this.reader;
    if (reader === null) {
      throw new BK880ConnectionError("序列埠讀取串流尚未開啟。");
    }

    while (true) {
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch (error) {
        throw this.normalizeConnectionError("讀取 BK880 回覆失敗", error);
      }
      if (result.done) {
        throw new BK880ConnectionError("BK880 序列埠已中斷或資料串流已結束。");
      }

      this.lineBuffer += this.decoder.decode(result.value, { stream: true });
      const newlineIndex = this.lineBuffer.indexOf("\n");
      if (newlineIndex >= 0) {
        const line = this.lineBuffer.slice(0, newlineIndex).replace(/\r$/, "");
        this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
        return line;
      }
    }
  }

  /**
   * Web Streams 沒有 reader.read 的標準 timeout 參數；逾時時主動關閉連線，
   * 避免殘留尚在等待的 read 導致下一次量測與舊回覆交錯。
   */
  private readLineWithTimeout(command: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        void this.close();
        reject(new BK880ConnectionError(`等待 ${command} 回覆逾時，已關閉連線。`));
      }, timeoutMs);

      void this.readNextLine().then(
        (line) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timer);
            resolve(line);
          }
        },
        (error: unknown) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timer);
            reject(error);
          }
        },
      );
    });
  }

  /** 實體裝置拔除時清理內部狀態，避免 UI 顯示假性已連線。 */
  private readonly handleDisconnect = (event: SerialConnectionEvent): void => {
    if (event.target !== this.port) {
      return;
    }
    void this.close().finally(() => this.disconnectCallback?.());
  };

  private requireSupport(): void {
    if (!WebSerialPort.isSupported()) {
      throw new BK880ConnectionError(
        "目前瀏覽器不支援 Web Serial API。請使用最新版 Chrome 或 Microsoft Edge，並由 localhost 或 HTTPS 網站開啟。",
      );
    }
  }

  private requireOpen(): SerialPort {
    this.requireSupport();
    if (this.port === null) {
      throw new BK880ConnectionError("尚未連線 BK880，請先按下「選擇並連線 BK880」。");
    }
    return this.port;
  }

  private normalizeConnectionError(prefix: string, error: unknown): BK880ConnectionError {
    const detail = error instanceof Error ? error.message : String(error);
    return new BK880ConnectionError(`${prefix}：${detail}`);
  }
}

