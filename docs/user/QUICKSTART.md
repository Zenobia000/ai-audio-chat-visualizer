# AI 語音對話 - 快速開始指南

## 功能簡介

使用 OpenAI Realtime API 實現即時語音對話功能。按住按鈕說話，AI 即時回應。

## 技術架構

- **前端**: Next.js + React + TypeScript
- **音訊處理**: Web Audio API
- **WebSocket 代理**: Node.js Proxy Server
- **AI 服務**: OpenAI Realtime API
- **參考專案**: [AwaisKamran/openai-realtime-api](https://github.com/AwaisKamran/openai-realtime-api)

## 快速啟動

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

建立 `.env` 檔案：

```env
OPENAI_API_KEY=your_openai_api_key_here
REALTIME_PROXY_PORT=8081
NEXT_PUBLIC_REALTIME_PROXY_URL=ws://localhost:8081
```

### 3. 啟動服務

**終端機 1 - 啟動 WebSocket Proxy:**

```bash
npm run proxy
```

**終端機 2 - 啟動開發伺服器:**

```bash
npm run dev
```

### 4. 訪問應用

開啟瀏覽器，訪問：

```
http://localhost:3000/realtime
```

## 使用說明

1. **連接狀態**: 頁面載入後會自動連接到 Realtime API
2. **開始對話**: 按住麥克風按鈕開始說話
3. **發送訊息**: 放開按鈕後，音訊會自動發送並處理
4. **接收回應**: AI 的語音回應會自動播放

## 核心實作

### 錄音流程

```typescript
// 按住按鈕 → 開始錄音 → 累積音訊
startRecording()

// 放開按鈕 → 停止錄音 → 發送完整音訊
stopRecording()
  → 轉換為 Base64
  → 發送 conversation.item.create 事件
  → 請求 AI 回應
```

### WebSocket 事件流程

```
Client                Proxy                 OpenAI
  |                     |                      |
  |--- connect -------->|                      |
  |                     |--- connect --------->|
  |                     |<-- session.created --|
  |<-- connected -------|                      |
  |                     |                      |
  |--- item.create ---->|--- item.create ----->|
  |--- response.create->|--- response.create->|
  |                     |<-- audio.delta ------|
  |<-- audio.delta -----|                      |
  |    (播放音訊)       |                      |
```

## 專案結構

```
├── app/
│   └── realtime/           # 語音對話頁面
│       └── page.tsx
├── src/main/typescript/
│   └── hooks/
│       └── useRealtimeAPI.ts   # Realtime API Hook
└── server/
    └── realtime-proxy.js       # WebSocket Proxy
```

## 核心改進（基於參考專案）

### v1 vs v2 差異

| 項目 | v1（舊版） | v2（新版 - 基於參考專案） |
|------|-----------|------------------------|
| **錄音方式** | 即時串流 | 累積後一次發送 |
| **事件類型** | `input_audio_buffer.append` | `conversation.item.create` |
| **VAD** | Server VAD | 手動控制 |
| **複雜度** | 較高 | 簡化 |

### 關鍵優勢

✅ **更穩定**: 移除複雜的 Server VAD 和緩衝管理
✅ **更簡單**: 採用檔案式錄音邏輯，易於理解
✅ **參考明確**: 基於成功的參考專案實作

## 故障排除

### 連接失敗

1. 確認 `.env` 中的 `OPENAI_API_KEY` 正確
2. 檢查 Proxy 是否在 8081 端口運行
3. 查看瀏覽器 Console 和終端機的錯誤訊息

### 音訊問題

1. 確認麥克風權限已授予
2. 檢查瀏覽器是否支援 Web Audio API
3. 測試麥克風是否正常工作

### Proxy 啟動失敗

```bash
# 檢查端口是否被佔用
netstat -ano | findstr :8081

# Windows: 終止進程
taskkill /PID <PID> /F

# 重新啟動 Proxy
npm run proxy
```

## 開發備註

- 舊版本已備份為 `.v1.backup.ts` / `.v1.backup.js`
- 參考專案邏輯已適配到 Web Audio API
- 支援繁體中文對話

## 授權

MIT License
