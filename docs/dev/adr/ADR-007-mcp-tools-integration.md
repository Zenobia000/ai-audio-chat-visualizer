# ADR-007: MCP 工具整合策略

---

**狀態 (Status):** `已接受 (Accepted)`

**決策者 (Deciders):** `PM, Technical Lead`

**日期 (Date):** `2025-10-17`

**技術顧問 (Consulted - 選填):** `Backend DEV, AI Specialist`

**受影響團隊 (Informed - 選填):** `All Development Team`

---

## 決策概要 (Executive Summary)

**決策:** 採用 **Model Context Protocol (MCP)** 整合外部工具,首要工具為 **Brave Search**

**理由:**
- 標準化工具整合協議
- OpenAI Realtime API 原生支援 Function Calling
- 可擴展架構,未來可加入更多工具
- Brave Search 提供即時網路資訊

**核心價值:**
讓 AI 語音助理能夠**即時查詢網路資訊**並整合到回應中,提供更準確且時效性的答案。

---

## 1. 背景 (Context)

### 1.1 MCP (Model Context Protocol)

**什麼是 MCP:**
- Anthropic 與社群共同開發的開放協議
- 標準化 AI 模型與外部工具的整合方式
- 支援多種工具類型 (Search, Database, File System, etc.)

**MCP 架構:**
```
AI Model (GPT-4o-realtime)
    ↓
Function Calling
    ↓
MCP Server (我們的後端)
    ↓
MCP Client (Brave Search)
    ↓
External Service (Brave API)
```

### 1.2 使用場景

**範例對話:**
```
用戶: "今天台北的天氣如何?"

AI 流程:
1. 偵測需要即時資訊
2. 調用 brave_web_search('台北天氣 今天')
3. 獲取搜尋結果
4. 整合結果生成語音回應
5. "根據最新資訊,台北今天多雲,溫度 25-28 度..."
```

---

## 2. 決策 (Decision)

### 2.1 MCP 工具清單

**Phase 1 (MVP):**
- ✅ **brave_web_search** - 網路搜尋

**Phase 2 (未來擴充):**
- ⏳ **brave_local_search** - 本地商家搜尋
- ⏳ **weather_api** - 即時天氣資訊
- ⏳ **knowledge_base** - 知識庫查詢

### 2.2 Brave Search 整合

**選擇 Brave Search 的理由:**
- ✅ 已有 MCP Server 實作 (`@modelcontextprotocol/server-brave-search`)
- ✅ 隱私優先,無追蹤
- ✅ API 簡單易用
- ✅ 免費額度充足

**實作架構:**
```typescript
// 1. 定義 Function Schema
const braveSearchFunction = {
  type: 'function',
  name: 'brave_web_search',
  description: 'Search the web for current information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (max 400 chars)'
      },
      count: {
        type: 'number',
        description: 'Number of results (1-20)',
        default: 3
      }
    },
    required: ['query']
  }
};

// 2. 註冊到 Realtime API Session
ws.send({
  type: 'session.update',
  session: {
    tools: [braveSearchFunction]
  }
});

// 3. 處理 Function Call
ws.on('message', async (event) => {
  if (event.type === 'response.function_call_arguments.done') {
    const { name, arguments: args } = event;

    if (name === 'brave_web_search') {
      // 調用 MCP Brave Search
      const results = await mcpBraveSearch(args.query, args.count);

      // 返回結果給 Realtime API
      ws.send({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: event.call_id,
          output: JSON.stringify(results)
        }
      });
    }
  }
});
```

---

## 3. 技術實作 (Implementation)

### 3.1 MCP Brave Search 封裝

```typescript
// lib/mcp/braveSearch.ts
import { mcp__brave_search__brave_web_search } from '@/mcp-tools';

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export async function mcpBraveSearch(
  query: string,
  count: number = 3
): Promise<BraveSearchResult[]> {
  try {
    const response = await mcp__brave_search__brave_web_search({
      query,
      count
    });

    return response.results.slice(0, count).map(result => ({
      title: result.title,
      url: result.url,
      description: result.description
    }));
  } catch (error) {
    console.error('MCP Brave Search Error:', error);
    return [];
  }
}
```

### 3.2 Realtime API Function Calling 處理

```typescript
// lib/realtime/functionHandler.ts
import { mcpBraveSearch } from '@/lib/mcp/braveSearch';

export async function handleFunctionCall(
  functionName: string,
  args: any
): Promise<string> {
  switch (functionName) {
    case 'brave_web_search':
      const results = await mcpBraveSearch(args.query, args.count || 3);
      return JSON.stringify({
        results,
        query: args.query,
        timestamp: Date.now()
      });

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}
```

---

## 4. 替代方案 (Alternatives)

### Option 1: 不整合外部工具 ❌

**缺點:** AI 只能基於訓練資料回答,缺乏即時資訊

---

### Option 2: 自行實作 Search API ❌

**缺點:**
- 需要額外開發
- 無標準協議
- 難以擴展

---

### Option 3: **使用 MCP 標準化整合 ✅**

**優點:**
- 標準化協議
- 易於擴展
- 社群支援
- 已有現成 MCP Servers

---

## 5. 風險與緩解 (Risks)

| 風險 | 緩解措施 |
|------|----------|
| **Brave API 配額用盡** | 監控用量、設定每日上限、備援 Google Search |
| **MCP 協議變動** | 版本鎖定、定期檢查更新 |
| **Function Calling 失敗** | Timeout 機制、Fallback 到無工具模式 |
| **搜尋結果品質低** | 優化 prompt、過濾結果、提供多個來源 |

---

## 6. 驗收標準 (Acceptance Criteria)

- [ ] MCP Brave Search 整合正常
- [ ] AI 能正確判斷何時需要搜尋
- [ ] 搜尋結果正確返回給 Realtime API
- [ ] AI 能整合搜尋結果到回應中
- [ ] Function Calling 延遲 < 2 秒
- [ ] 錯誤處理完善 (API 失敗時優雅降級)
- [ ] 成本監控系統運作

---

## 7. 參考資源 (References)

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Brave Search Server](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Brave Search API](https://brave.com/search/api/)

---

**版本:** v1.0
**最後更新:** 2025-10-17
**相關 ADR:** ADR-006 (Realtime API Integration)

**END OF ADR**
