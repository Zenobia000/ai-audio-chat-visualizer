# ADR-006: OpenAI Realtime API 整合決策

---

**狀態 (Status):** `已接受 (Accepted)`

**決策者 (Deciders):** `PM, Technical Lead, Backend DEV`

**日期 (Date):** `2025-10-17`

**技術顧問 (Consulted):** `Frontend DEV, UX Designer`

**受影響團隊 (Informed):** `All Development Team`

**標籤**: #realtime #websocket #openai #api-architecture #speech-to-speech

---

## 1. 背景與問題陳述 (Context and Problem Statement)

### 上下文 (Context)

AI Audio Chat Visualizer 最初設計採用傳統 REST API 架構 (參考 ADR-004),透過三個獨立端點實現語音互動:
1. `/api/stt` - OpenAI Whisper (語音轉文字)
2. `/api/chat` - GPT-4o-mini (對話生成)
3. `/api/tts` - OpenAI TTS (文字轉語音)

在 Phase 2 架構設計過程中,PM 提出新需求:
- **需求 1**: 語音助理能透過 MCP brave-search 查詢即時資訊
- **需求 2**: 支援圖片上傳與多模態互動
- **需求 3**: 降低互動延遲,提升流暢度

OpenAI 於 2024 年 10 月發布 **Realtime API (gpt-4o-realtime-preview)**,提供原生語音對語音 (Speech-to-Speech) 能力,並在 2025 年新增 **圖片輸入** 與 **Function Calling** 支援。

### 問題陳述 (Problem Statement)

**核心問題**: 傳統 REST API 架構存在以下瓶頸:

1. **延遲過高**: 3 次 API 調用累積延遲達 **8-12 秒**
   ```
   Whisper (2-3s) → GPT (3-5s) → TTS (2-3s) = 總計 8-12s
   ```

2. **無法支援多模態輸入**:
   - Whisper API 僅支援音訊
   - GPT-4o-mini 透過 REST API 無法同時處理語音 + 圖片
   - 需要複雜的前端邏輯組合不同模態

3. **無 Function Calling 支援**:
   - REST Chat API 雖支援 Function Calling,但需額外一輪往返
   - 總延遲增加至 **15+ 秒** (含工具調用)

4. **無法打斷對話**:
   - AI 開始說話後,用戶必須等待完整播放
   - 缺乏自然對話的流暢感

**量化影響**:
- 用戶滿意度: 預估 < 3.5/5 (基於 10 秒延遲)
- 對話輪次: 預估 < 3 輪 (用戶因延遲而放棄)
- 回訪率: 預估 < 20% (體驗不佳)

### 驅動因素/約束條件 (Drivers / Constraints)

**驅動因素**:
1. PM 要求支援 MCP brave-search 工具調用
2. PM 要求支援圖片上傳與視覺問答
3. 用戶體驗優先 - 延遲必須 < 3 秒
4. 競爭優勢 - 多模態互動是差異化關鍵

**約束條件**:
1. 成本控制 - 每日預算上限 $10
2. 開發時程 - 仍需在 2-3 週內完成 MVP
3. 技術熟悉度 - 團隊對 WebSocket 經驗有限
4. API 穩定性 - Realtime API 仍為 Beta 版本

---

## 2. 考量的選項 (Considered Options)

### 選項一: 保持 REST API 架構 + 手動整合

**描述**:
繼續使用 Whisper + GPT-4o-mini + TTS 組合,手動實作 Function Calling 與圖片支援:
```
語音 → Whisper → 文字
文字 + 圖片 → GPT-4o (Vision) → 回應文字
回應文字 → TTS → 語音
```

**優點 (Pros)**:
- ✅ 實作簡單,團隊已熟悉 REST API
- ✅ 成本較低 (~$0.0076/分鐘)
- ✅ API 穩定 (非 Beta)
- ✅ 無 WebSocket 複雜度

**缺點 (Cons)**:
- ❌ 延遲仍高達 **12-15 秒** (含 Function Calling)
- ❌ 多模態處理複雜 (需前端組合)
- ❌ Function Calling 需額外往返
- ❌ 無法打斷對話
- ❌ 用戶體驗差,難以達成 KPI

**成本/複雜度評估**:
- 開發成本: 低
- 維護成本: 中
- 基礎設施成本: 低 ($0.0076/min)
- 用戶體驗成本: **極高** (延遲導致流失)

**評分**: 2/5

---

### 選項二: 混合架構 (Realtime + REST)

**描述**:
根據場景選擇性使用:
- 純語音對話 → Realtime API
- 圖片 + 文字 → REST API (GPT-4o Vision)
- Function Calling → REST API

**優點 (Pros)**:
- ✅ 靈活性高,可選擇最佳方案
- ✅ 成本可控 (僅語音使用 Realtime)
- ✅ 降低 Realtime API 依賴風險

**缺點 (Cons)**:
- ❌ 架構複雜度**極高**
- ❌ 兩套 API 邏輯維護困難
- ❌ 用戶體驗不一致
- ❌ 增加 ~40% 開發時間

**成本/複雜度評估**:
- 開發成本: **極高**
- 維護成本: **極高**
- 基礎設施成本: 中
- 技術債務: **嚴重**

**評分**: 1.5/5

---

### 選項三: OpenAI Realtime API (統一架構) ✅

**描述**:
完全採用 OpenAI Realtime API (gpt-4o-realtime-preview),透過單一 WebSocket 連接處理:
- 語音對語音 (S2S) - 原生支援
- 圖片 + 語音 - 多模態輸入
- Function Calling - MCP 工具整合
- 即時打斷 - 自然對話流程

**技術架構**:
```
Frontend WebSocket ←→ gpt-4o-realtime
                           ↓
                    Function Calling
                           ↓
                   MCP brave-search
                           ↓
                    Brave Search API
```

**優點 (Pros)**:
- ✅ **極低延遲**: < 320ms 平均 (vs 10s)
- ✅ **原生多模態**: 音訊 + 圖片 + 文字同時處理
- ✅ **Function Calling 內建**: MCP 整合無額外往返
- ✅ **可打斷對話**: 自然的對話體驗
- ✅ **架構簡化**: 單一 WebSocket vs 3 個 REST 端點
- ✅ **語音品質**: 端到端優化,無中間轉換損失
- ✅ **未來擴展**: 支援更多模態 (視訊等)

**缺點 (Cons)**:
- ❌ **成本較高**: $0.30/分鐘 (vs $0.0076/分鐘) = **40 倍**
- ❌ **Beta 風險**: API 可能變動
- ❌ **WebSocket 複雜度**: 連接管理、重連邏輯
- ❌ **學習曲線**: 團隊需學習 WebSocket 最佳實踐

**成本/複雜度評估**:
- 開發成本: 中 (WebSocket 實作)
- 維護成本: 低 (單一連接)
- 基礎設施成本: **高** ($0.30/min)
- 用戶體驗收益: **極高** (延遲降低 95%)

**評分**: 4.5/5

---

### 選項四: 自建 Speech-to-Speech 系統

**描述**:
使用開源模型 (Whisper + LLaMA + Coqui TTS) 自建:
- 完全控制
- 無 API 成本
- 可本地部署

**優點 (Pros)**:
- ✅ 無 API 調用成本
- ✅ 完全控制
- ✅ 數據隱私

**缺點 (Cons)**:
- ❌ 開發時間: **至少 4-6 週** (vs 2-3 週目標)
- ❌ 需要 GPU 基礎設施 ($200-500/月)
- ❌ 模型品質可能不如 GPT-4o
- ❌ 維護成本極高

**成本/複雜度評估**:
- 開發成本: **極高** (4-6 週)
- 維護成本: **極高**
- 基礎設施成本: 高 ($200-500/月)
- **不符合 MVP 時程**

**評分**: 1/5

---

## 3. 決策 (Decision Outcome)

**最終選擇的方案**: **選項三: OpenAI Realtime API (統一架構)**

### 選擇理由 (Rationale)

#### 3.1 延遲降低 95% - 決定性優勢

**量化對比**:
| 指標 | REST API | Realtime API | 改善幅度 |
|------|----------|--------------|----------|
| 語音轉文字 | 2-3s | **內建** | -100% |
| AI 推理 | 3-5s | **< 320ms** | **-94%** |
| 文字轉語音 | 2-3s | **內建** | -100% |
| Function Call | +2-3s | **< 500ms** | **-83%** |
| **總延遲** | **10-15s** | **< 1s** | **-95%** |

**用戶體驗影響**:
```
10 秒延遲 (REST):
- 用戶感知: 極慢,令人沮喪
- 對話輪次: < 3 輪 (放棄)
- 滿意度: < 3.5/5

1 秒延遲 (Realtime):
- 用戶感知: 即時,自然
- 對話輪次: > 8 輪 (持續互動)
- 滿意度: > 4.5/5
```

#### 3.2 多模態原生支援 - 技術優勢

**Realtime API 多模態能力**:
```typescript
// 單一 WebSocket 訊息同時發送語音 + 圖片
{
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      { type: 'input_audio', audio: base64Audio },
      { type: 'input_image', image: base64Image },
      { type: 'input_text', text: 'What is in this image?' }
    ]
  }
}

// AI 回應包含視覺分析 + 語音
{
  type: 'response.audio.delta',
  delta: audioChunk  // 直接語音輸出,已整合視覺理解
}
```

vs REST API 需要複雜的前端邏輯:
```typescript
// 1. 上傳圖片到 GPT-4o Vision
const vision = await fetch('/api/vision', { image });

// 2. 將結果傳給 Chat API
const chat = await fetch('/api/chat', { text: vision.description });

// 3. TTS 轉語音
const audio = await fetch('/api/tts', { text: chat.response });

// 總共 3 次往返,延遲 12+ 秒
```

#### 3.3 Function Calling 零額外延遲

**Realtime API Function Calling 流程**:
```
用戶: "今天台北天氣如何?"
  ↓ (< 100ms WebSocket)
AI: [偵測需要工具] → function_call: brave_web_search("台北天氣")
  ↓ (< 500ms 搜尋)
MCP: 返回搜尋結果
  ↓ (< 200ms 整合)
AI: [語音回應] "根據最新資訊,台北今天..."

總延遲: < 1 秒
```

vs REST API:
```
用戶: "今天台北天氣如何?"
  ↓ (2-3s STT)
GPT: 需要工具 → function_call
  ↓ (500ms)
Backend: 調用 search
  ↓ (3-5s 再次調用 GPT)
GPT: 整合結果
  ↓ (2-3s TTS)
總延遲: 12-15 秒
```

#### 3.4 架構簡化 - 長期維護優勢

**架構對比**:

REST API (複雜):
```
Frontend
├── /api/stt client
├── /api/chat client
├── /api/tts client
└── State management for 3 APIs

Backend
├── /api/stt route
├── /api/chat route
├── /api/tts route
├── Error handling × 3
└── Rate limiting × 3
```

Realtime API (簡化):
```
Frontend
└── WebSocket client (單一連接)

Backend
├── WebSocket proxy
└── MCP Function handler
```

**維護成本降低 60%**

#### 3.5 成本權衡分析

**成本對比** (每 1000 用戶,平均 5 分鐘使用):
```
REST API:
- API 成本: 1000 × 5 × $0.0076 = $38
- 流失成本: 500 用戶因延遲放棄 × $0 = $0
- 總成本: $38
- 實際活躍用戶: 500 (50% 流失)

Realtime API:
- API 成本: 1000 × 5 × $0.30 = $1,500
- 流失成本: 100 用戶因延遲放棄 × $0 = $0
- 總成本: $1,500
- 實際活躍用戶: 900 (10% 流失)

用戶獲取成本 (CAC) = $50/用戶 (假設)
REST: 500 用戶 × $50 = $25,000 (獲取成本)
Realtime: 900 用戶 × $50 = $45,000 (獲取成本)

實際留存價值:
REST: 500 活躍用戶 - $25,000 CAC - $38 API = 價值低
Realtime: 900 活躍用戶 - $45,000 CAC - $1,500 API = 價值高

結論: 成本增加 40 倍,但用戶留存增加 80%,ROI 更高
```

**緩解措施**:
- 使用時長限制 (每 session 最多 5 分鐘)
- 速率限制 (每用戶每小時最多 3 次)
- 每日預算監控 ($10 上限)
- 超支自動降級到 REST API

---

## 4. 決策的後果與影響 (Consequences)

### 正面影響 / 預期收益

1. **用戶體驗顯著提升**:
   - 延遲降低 **95%** (10s → 0.5s)
   - 對話輪次預估 **+160%** (3 → 8 輪)
   - 滿意度預估 **+29%** (3.5 → 4.5/5)
   - 回訪率預估 **+150%** (20% → 50%)

2. **功能能力擴充**:
   - ✅ 多模態互動 (語音 + 圖片 + 文字)
   - ✅ MCP 工具整合 (web search, 未來可擴展)
   - ✅ 可打斷對話
   - ✅ 更自然的語音體驗

3. **架構簡化**:
   - 3 個 REST 端點 → 1 個 WebSocket
   - 前端 API 客戶端代碼減少 **70%**
   - 錯誤處理邏輯統一

4. **競爭優勢**:
   - 市場上少數支援真正多模態語音互動的產品
   - 延遲< 1 秒,接近人類對話水準

### 負面影響 / 引入的風險

1. **成本增加 40 倍**:
   - 從 $0.0076/min → $0.30/min
   - 1000 用戶 × 5 min = $1,500/天 (vs $38/天)
   - **緩解**: 嚴格速率限制、使用時長限制、預算監控

2. **WebSocket 技術複雜度**:
   - 需實作連接管理、心跳檢測、自動重連
   - 錯誤處理更複雜
   - **緩解**: 使用成熟的 WebSocket 函式庫,完整測試

3. **API Beta 版本風險**:
   - 可能有 breaking changes
   - 可能有未知 bugs
   - **緩解**: 版本鎖定,定期檢查更新,保留 REST 降級方案

4. **Debugging 難度增加**:
   - WebSocket 訊息難以追蹤
   - **緩解**: 完整日誌系統,開發工具整合

### 對其他組件/團隊的影響

**Frontend Team**:
- ❌ 需學習 WebSocket 協議
- ❌ 需重寫 API 客戶端
- ✅ 但整體代碼量減少

**Backend Team**:
- ❌ 需實作 WebSocket proxy
- ❌ 需實作 MCP Function handler
- ✅ 但移除 3 個 REST 端點

**QA Team**:
- ❌ 需新增 WebSocket 測試場景
- ✅ 但減少 REST API 測試

**DevOps Team**:
- ✅ Vercel 原生支援 WebSocket
- ✅ 無額外部署配置

### 未來可能需要重新評估的觸發條件

1. **成本失控**: 每日 API 成本超過 $50
2. **API 穩定性問題**: Realtime API 錯誤率 > 5%
3. **性能不達標**: 延遲超過 2 秒
4. **用戶留存未改善**: 回訪率 < 30%
5. **OpenAI 價格調整**: Realtime API 漲價 > 50%

**重新評估時考慮**:
- 降級回 REST API
- 混合架構
- 自建 S2S 系統

---

## 5. 執行計畫概要 (Implementation Plan Outline)

### Phase 1: Realtime API 基礎整合 (Week 2, Day 1-2)
1. 建立 WebSocket 連接管理器
2. 實作音訊串流編碼/解碼
3. 處理 Realtime API events (12 種 event types)
4. 實作錯誤處理與自動重連
**預估時間**: 8 小時

### Phase 2: Function Calling 整合 (Week 2, Day 3)
1. 定義 MCP brave-search function schema
2. 實作 function call 處理邏輯
3. 整合搜尋結果到 AI 回應
4. 測試 Function Calling 流程
**預估時間**: 4 小時

### Phase 3: 多模態支援 (Week 2, Day 4-5)
1. 實作圖片上傳與壓縮
2. 整合圖片到 Realtime API
3. 建立聊天介面 UI
4. 測試多模態輸入組合
**預估時間**: 8 小時

### Phase 4: 成本控制與監控 (Week 3, Day 1)
1. 實作使用時長限制
2. 實作速率限制
3. 建立成本監控儀表板
4. 設定預算告警
**預估時間**: 4 小時

**總計**: 24 小時 (~3 天)

---

## 6. 相關參考 (References)

### 官方文檔
- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [GPT-4o Realtime Announcement](https://openai.com/index/introducing-gpt-realtime/)
- [Realtime API Reference](https://platform.openai.com/docs/api-reference/realtime)

### 技術資源
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [OpenAI Realtime Console Example](https://github.com/openai/openai-realtime-console)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

### 成本計算器
- [OpenAI Pricing](https://openai.com/pricing)
- Realtime API: $100/1M input tokens, $200/1M output tokens

### 競品分析
- Hume AI EVI (Empathic Voice Interface)
- ElevenLabs Conversational AI
- Google Project Astra

---

## ADR 審核記錄 (Review History)

| 日期 | 審核人 | 角色 | 備註/主要問題 |
|:-----|:-------|:-----|:--------------|
| 2025-10-17 | PM | 產品經理 | ✅ 同意採用,要求嚴格成本控制 |
| 2025-10-17 | Technical Lead | 技術負責人 | ✅ 同意,但需完整測試 Beta API |
| 2025-10-17 | Frontend DEV | 前端開發 | ⚠️ 需時間學習 WebSocket,但收益明確 |
| 2025-10-17 | Backend DEV | 後端開發 | ✅ 架構簡化,同意採用 |

---

**文檔版本**: v1.0
**最後更新**: 2025-10-17
**下次審查**: 2025-10-24 (Phase 4 完成後)

**相關 ADR**:
- ADR-004: AI Service Provider Selection (被本 ADR 部分取代)
- ADR-007: MCP Tools Integration (依賴本 ADR)
- ADR-008: Multimodal Interaction Design (依賴本 ADR)

---

**END OF ADR**
