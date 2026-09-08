import type { PrimaryParameter, SecondaryParameter } from "./models";

/**
 * 將 BK880 的 SI 基準數值轉成操作畫面容易閱讀的工程單位。
 * 次參數 D、Q 為無單位，THETA 則以 deg 顯示；此規則對齊 Python 基礎程式。
 */
export function formatEngineering(
  value: number,
  parameter: PrimaryParameter | SecondaryParameter,
): string {
  if (!Number.isFinite(value)) {
    return "----";
  }

  const unitChoices =
    parameter === "C"
      ? [[1e-3, "mF"], [1e-6, "µF"], [1e-9, "nF"], [1e-12, "pF"]] as const
      : parameter === "L"
        ? [[1, "H"], [1e-3, "mH"], [1e-6, "µH"], [1e-9, "nH"]] as const
        : parameter === "R" || parameter === "Z"
          ? [[1e6, "MΩ"], [1e3, "kΩ"], [1, "Ω"]] as const
          : [];

  if (parameter === "D" || parameter === "Q") {
    return value.toExponential(6);
  }
  if (parameter === "THETA") {
    return `${value.toFixed(6)} deg`;
  }

  const magnitude = Math.abs(value);
  for (const [factor, unit] of unitChoices) {
    if (magnitude >= factor) {
      return `${(value / factor).toFixed(6)} ${unit}`;
    }
  }

  return `${value.toExponential(6)} ${parameter === "C" ? "F" : parameter === "L" ? "H" : "Ω"}`;
}

/** 將瀏覽器 Web Serial 的 USB 資訊轉成僅供辨識的文字，沒有資料時不猜測 COM 埠號。 */
export function formatPortInfo(info: SerialPortInfo): string {
  if (info.usbVendorId === undefined && info.usbProductId === undefined) {
    return "已選取序列埠（瀏覽器未提供裝置識別資訊）";
  }

  const vendor = info.usbVendorId?.toString(16).padStart(4, "0") ?? "????";
  const product = info.usbProductId?.toString(16).padStart(4, "0") ?? "????";
  return `已選取 USB 序列埠（VID:PID = ${vendor}:${product}）`;
}
