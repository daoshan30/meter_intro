# Meter Intro

Meter Intro 是一個使用 Next.js 建立的量測儀器介紹與 Web Serial 實驗介面網站。目前包含首頁展示，以及 BK880 / LCR-615 的瀏覽器量測介面原型。

> Repository：`daoshan30/meter_intro`  
> 目前建議狀態：Private，待文件、免責聲明與公開範圍確認後再決定是否 Public。  
> Web Serial 支援：Chrome / Edge，且需要 HTTPS 或 localhost。

---

## 功能內容

- Meter Intro 官網首頁。
- 數位萬用電錶、LCR meter、示波器等量測設備介紹。
- BK880 / LCR-615 Web Serial API 量測頁面。
- Vercel Analytics 流量分析元件。
- Next.js App Router 與 Tailwind CSS。

---

## BK880 Web Serial API 說明

本專案中的 BK880 Web Serial 頁面使用瀏覽器 Web Serial API 與使用者本機電腦上的序列埠裝置溝通。

重要限制：

- Web Serial API 需要使用者在瀏覽器中手動授權序列埠。
- 網頁無法在未經授權的情況下直接存取使用者 COM Port。
- 遠端網站不能直接控制開發者電腦上的 BK880；使用者只能操作自己電腦上已授權的設備。
- Web Serial API 主要支援 Chrome / Edge。
- 正式部署時需要 HTTPS；本地測試可使用 `localhost`。

---

## 安裝與本地開發

請先安裝 Node.js，然後在專案根目錄執行：

```bash
npm install
```

啟動本地開發伺服器：

```bash
npm run dev
```

開啟：

```text
http://localhost:3000
```

若要測試 BK880 Web Serial 頁面，請使用支援 Web Serial API 的 Chrome 或 Edge。

---

## 常用指令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## 環境變數與敏感資料

目前專案不需要 API Key 才能執行基本頁面與 BK880 Web Serial 功能。

已知安全原則：

- 不要提交 `.env`、`.env.local`、API Key、Token、密碼或私有憑證。
- `.gitignore` 已排除 `.env*`、`.vercel`、`.next`、`node_modules`。
- 若未來加入後端 API、資料庫、付款或登入功能，請將敏感資料放在伺服器端環境變數，不要放入前端程式。
- `NEXT_PUBLIC_*` 變數會被打包到前端，不能存放秘密。

2026-09-10 檢查結果：

- 未發現 `.env` 類檔案。
- 未發現常見 API key、GitHub token、private key 或 password 類敏感字串。
- 未發現 Git 追蹤中的 `.env`、`.key`、`.pem`、`.p12`、`.pfx` 類敏感檔案。

---

## 部署

本專案可部署到 Vercel。

注意：

- GitHub repo 改成 Private 只代表原始碼不公開。
- 如果 Vercel 網站仍公開，使用者仍可瀏覽網站頁面，且前端 JavaScript 仍會被瀏覽器下載。
- 若要完全限制外部使用者存取，需另外設定 Vercel 專案存取權限或下架對應頁面。

---

## License

本專案目前採用 MIT License，詳見 [`LICENSE`](LICENSE)。

---

## Disclaimer

本專案包含儀器量測相關的 Web Serial 實驗功能。量測結果、儀器設定、通訊流程與設備相容性可能受到 BK880 / LCR-615 韌體版本、USB COM 驅動、瀏覽器版本與作業系統環境影響。

本專案不是 B&K Precision 官方軟體，也不保證適用於所有設備或所有使用情境。使用者應自行確認量測條件與量測結果是否符合實驗、教育或生產需求。

完整免責聲明請見 [`DISCLAIMER.md`](DISCLAIMER.md)。
