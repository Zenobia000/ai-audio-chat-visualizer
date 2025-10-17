# BDD 使用者場景 (Behavior-Driven Development Scenarios)

**專案**: AI Audio Chat Visualizer
**版本**: v1.0.0
**最後更新**: 2025-10-17
**測試框架**: Gherkin Syntax (Given-When-Then)

---

## 📋 文檔目的

本文檔定義 AI Audio Chat Visualizer 的端到端使用者場景，使用 Gherkin 語法撰寫，以便：
1. 明確定義使用者行為與預期結果
2. 作為 E2E 測試的基礎
3. 確保開發符合使用者需求
4. 促進開發團隊與 PM 的溝通

---

## 🎯 核心使用者旅程

### Feature 1: 首次使用體驗

#### Scenario 1.1: 新用戶首次進入網站

```gherkin
Feature: 首次使用體驗
  作為新用戶
  我想要快速理解如何使用這個應用
  以便開始與 AI 互動

Scenario: 新用戶首次進入網站
  Given 我是第一次訪問 AI Audio Chat Visualizer
  When 我開啟網站首頁
  Then 我應該看到歡迎畫面
  And 我應該看到「開始體驗」按鈕
  And 我應該看到 3D 視覺化動畫正在運行
  And 頁面載入時間應該少於 2 秒

  # 驗收標準
  # ✓ 首頁載入 < 2 秒
  # ✓ 3D 視覺化自動播放
  # ✓ UI 元素清晰可見
```

#### Scenario 1.2: 授權麥克風權限

```gherkin
Scenario: 用戶授權麥克風權限
  Given 我在首頁點擊「開始體驗」
  When 瀏覽器彈出麥克風權限請求
  And 我點擊「允許」
  Then 麥克風圖示應該變為啟用狀態
  And 應該顯示「請說話」提示
  And 音訊波形視覺化應該開始顯示

  # 驗收標準
  # ✓ 權限請求顯示
  # ✓ 授權後介面更新
  # ✓ 即時音訊視覺化
```

#### Scenario 1.3: 拒絕麥克風權限的降級體驗

```gherkin
Scenario: 用戶拒絕麥克風權限
  Given 我在首頁點擊「開始體驗」
  When 瀏覽器彈出麥克風權限請求
  And 我點擊「拒絕」
  Then 應該顯示提示訊息「需要麥克風權限來使用語音功能」
  And 應該顯示「改用文字輸入」按鈕
  When 我點擊「改用文字輸入」
  Then 文字輸入框應該顯示
  And 我應該能正常輸入文字並對話

  # 驗收標準
  # ✓ 友善的錯誤提示
  # ✓ 提供替代方案
  # ✓ 降級體驗可用
```

---

### Feature 2: 3D 音訊視覺化

#### Scenario 2.1: 即時音訊視覺化

```gherkin
Feature: 3D 音訊視覺化
  作為用戶
  我想要看到聲音的視覺化呈現
  以便獲得沉浸式體驗

Scenario: 錄音時的即時視覺化
  Given 我已授權麥克風權限
  And 我在對話頁面
  When 我點擊麥克風按鈕開始錄音
  And 我開始說話
  Then 3D 粒子應該隨著我的聲音振幅變化
  And 視覺化應該有顏色漸變效果
  And 幀率應該保持在 30 FPS 以上

  # 驗收標準
  # ✓ 延遲 < 100ms
  # ✓ FPS ≥ 30
  # ✓ 視覺效果流暢
```

#### Scenario 2.2: AI 回應時的視覺化

```gherkin
Scenario: AI 語音回應時的視覺化
  Given 我已完成一次語音輸入
  And AI 正在播放語音回應
  When AI 語音播放
  Then 3D 視覺化應該隨 AI 語音變化
  And 視覺化顏色應該與用戶輸入時不同（例如藍色 vs 綠色）
  And 粒子密度應該反映音訊振幅

  # 驗收標準
  # ✓ 同步延遲 < 50ms
  # ✓ 視覺區分明顯
  # ✓ 效果連續流暢
```

#### Scenario 2.3: 切換視覺化模式

```gherkin
Scenario: 用戶切換視覺化模式
  Given 我在對話頁面
  When 我點擊視覺化模式切換按鈕
  Then 應該顯示模式選單（粒子、波形、幾何體）
  When 我選擇「波形」模式
  Then 3D 場景應該在 1 秒內切換到波形視覺化
  And 新模式應該即時反應音訊

  # 驗收標準
  # ✓ 切換時間 < 1 秒
  # ✓ 無卡頓
  # ✓ 至少 3 種模式
```

---

### Feature 3: 語音對話流程

#### Scenario 3.1: 完整的語音對話流程

```gherkin
Feature: 語音對話
  作為用戶
  我想要用語音與 AI 對話
  以便解放雙手並獲得自然體驗

Scenario: 完整的語音對話流程
  Given 我已授權麥克風權限
  And 我在對話頁面
  When 我點擊麥克風按鈕
  And 我說「你好，你是誰？」
  And 我點擊停止錄音
  Then 錄音應該上傳並轉換為文字
  And 轉錄文字應該顯示「你好，你是誰？」
  And 應該顯示「AI 正在思考...」載入動畫
  When AI 回應生成完成
  Then 應該顯示 AI 回應文字
  And 應該自動播放 AI 語音
  And 整個流程應該在 10 秒內完成

  # 驗收標準
  # ✓ STT 準確率 > 90%
  # ✓ 總延遲 < 10 秒
  # ✓ TTS 自然度 > 4/5
```

#### Scenario 3.2: 多輪對話上下文記憶

```gherkin
Scenario: AI 記住對話上下文
  Given 我已完成第一輪對話
  And 我對 AI 說「我叫 Alice」
  And AI 已回應
  When 我開始第二輪對話
  And 我說「我的名字是什麼？」
  Then AI 應該回應包含「Alice」
  And 對話歷史應該顯示兩輪對話

  # 驗收標準
  # ✓ 記住至少 10 輪對話
  # ✓ 上下文相關性 > 85%
```

#### Scenario 3.3: 中斷 AI 回應

```gherkin
Scenario: 用戶中斷 AI 語音回應
  Given AI 正在播放語音回應
  And 回應尚未播放完畢
  When 我點擊「停止」按鈕
  Then 語音播放應該立即停止
  And 視覺化應該停止變化
  And 我應該能立即開始新一輪對話

  # 驗收標準
  # ✓ 停止延遲 < 200ms
  # ✓ 無殘留音訊
```

---

### Feature 4: 對話歷史與管理

#### Scenario 4.1: 查看對話歷史

```gherkin
Feature: 對話歷史
  作為用戶
  我想要查看過往的對話記錄
  以便回顧內容

Scenario: 查看對話歷史
  Given 我已完成 5 輪對話
  When 我向下滾動對話區域
  Then 應該看到所有 5 輪對話
  And 每輪對話應該清楚標示用戶/AI
  And 每輪對話應該顯示時間戳記

  # 驗收標準
  # ✓ 對話完整保存
  # ✓ 時間戳記正確
  # ✓ 滾動流暢
```

#### Scenario 4.2: 清除對話歷史

```gherkin
Scenario: 用戶清除對話歷史
  Given 我有 5 輪對話記錄
  When 我點擊「新對話」按鈕
  Then 應該彈出確認對話框「確定要開始新對話嗎？」
  When 我點擊「確定」
  Then 對話歷史應該清空
  And AI 應該忘記之前的上下文
  And 3D 場景應該重置

  # 驗收標準
  # ✓ 確認對話框顯示
  # ✓ 歷史完全清除
  # ✓ 場景重置
```

---

### Feature 5: 錯誤處理與容錯

#### Scenario 5.1: 網路中斷處理

```gherkin
Feature: 錯誤處理
  作為用戶
  我想要在發生錯誤時獲得清楚的提示
  以便知道如何處理

Scenario: 網路中斷時的錯誤處理
  Given 我正在錄音
  When 網路連線中斷
  And 我完成錄音
  Then 應該顯示錯誤訊息「網路連線失敗，請檢查網路」
  And 應該提供「重試」按鈕
  When 網路恢復
  And 我點擊「重試」
  Then 應該重新上傳音訊並處理

  # 驗收標準
  # ✓ 錯誤提示友善
  # ✓ 提供重試機制
  # ✓ 自動偵測網路恢復
```

#### Scenario 5.2: API 超時處理

```gherkin
Scenario: API 回應超時
  Given 我已發送語音請求
  When API 回應時間超過 15 秒
  Then 應該顯示「處理時間較長，請稍候...」
  When 超過 30 秒仍無回應
  Then 應該顯示「伺服器回應超時，請重試」
  And 提供「重試」與「取消」按鈕

  # 驗收標準
  # ✓ 超時閾值: 30 秒
  # ✓ 友善提示
  # ✓ 可重試/取消
```

#### Scenario 5.3: 語音辨識失敗

```gherkin
Scenario: 語音辨識準確率過低
  Given 我在嘈雜環境錄音
  When 語音轉文字準確率 < 60%
  Then 應該顯示轉錄文字並標註「辨識可能不準確」
  And 應該提供「編輯文字」按鈕
  When 我點擊「編輯文字」
  Then 應該顯示可編輯的文字框
  And 我應該能修改並重新提交

  # 驗收標準
  # ✓ 低準確率提示
  # ✓ 可手動修正
```

---

### Feature 6: 效能與優化

#### Scenario 6.1: 低階裝置降級

```gherkin
Feature: 效能優化
  作為低階裝置用戶
  我希望應用仍能流暢運行
  以便使用核心功能

Scenario: 偵測到低效能自動降級
  Given 我使用低階手機（GPU 效能不足）
  When 頁面載入並偵測裝置效能
  Then 應該顯示提示「已啟用效能模式」
  And 3D 視覺化應該降級為 2D Canvas
  And 幀率應該保持在 20 FPS 以上
  And 核心功能（STT/Chat/TTS）應該正常運作

  # 驗收標準
  # ✓ 自動偵測裝置
  # ✓ 降級提示
  # ✓ FPS ≥ 20
  # ✓ 核心功能可用
```

#### Scenario 6.2: 圖片與資源優化

```gherkin
Scenario: 資源載入優化
  Given 我首次訪問網站
  When 頁面開始載入
  Then 關鍵資源應該優先載入（CSS, JS）
  And 圖片應該使用 lazy loading
  And 3D 模型應該使用漸進式載入
  And 首次內容繪製（FCP）應該 < 1 秒

  # 驗收標準
  # ✓ FCP < 1 秒
  # ✓ LCP < 2.5 秒
  # ✓ Lazy loading 運作
```

---

### Feature 7: 跨瀏覽器兼容性

#### Scenario 7.1: Chrome 瀏覽器支援

```gherkin
Feature: 跨瀏覽器兼容性
  作為用戶
  我希望在不同瀏覽器都能使用
  以便靈活選擇

Scenario: 在 Chrome 上完整功能運作
  Given 我使用 Chrome 瀏覽器（版本 90+）
  When 我執行完整對話流程
  Then 所有功能應該正常運作
  And 3D 視覺化應該流暢
  And WebGL 支援應該正常
  And 音訊 API 應該正常

  # 驗收標準
  # ✓ Chrome 90+ 完全支援
  # ✓ 無主控台錯誤
```

#### Scenario 7.2: Safari 瀏覽器兼容

```gherkin
Scenario: Safari 上的兼容性處理
  Given 我使用 Safari 瀏覽器（版本 14+）
  When 我執行對話流程
  Then Web Audio API 應該正常運作
  And MediaRecorder 應該正常錄音
  And 若有不支援功能應該顯示提示
  And 應該提供 Chrome 下載連結

  # 驗收標準
  # ✓ Safari 14+ 基本支援
  # ✓ 不支援功能友善提示
```

---

## 🎯 量化驗收標準總覽

| 類別 | 指標 | 目標值 | 優先級 |
|-----|------|-------|-------|
| **效能** | 首頁載入時間 | < 2 秒 | P0 |
| | API 總延遲 | < 10 秒 | P0 |
| | 3D 渲染 FPS (桌面) | ≥ 60 | P0 |
| | 3D 渲染 FPS (手機) | ≥ 30 | P0 |
| | 音訊視覺化延遲 | < 100ms | P0 |
| **準確性** | STT 辨識準確率 | > 90% | P0 |
| | Chat 相關性 | > 85% | P0 |
| | TTS 自然度 (MOS) | > 4/5 | P0 |
| **可用性** | 新用戶上手時間 | < 1 分鐘 | P0 |
| | 對話輪次記憶 | ≥ 10 輪 | P1 |
| | 錯誤恢復率 | 100% | P0 |
| **兼容性** | Chrome 支援 | 90+ | P0 |
| | Safari 支援 | 14+ | P1 |
| | Firefox 支援 | 88+ | P1 |
| | 手機支援 | iOS 14+, Android 10+ | P1 |

---

## 🧪 測試執行計劃

### Phase 1: 單元測試（Week 2）
- [ ] STT 服務測試
- [ ] Chat 服務測試
- [ ] TTS 服務測試
- [ ] 3D 視覺化元件測試

### Phase 2: 整合測試（Week 2-3）
- [ ] 完整對話流程測試
- [ ] API 整合測試
- [ ] 錯誤處理測試

### Phase 3: E2E 測試（Week 3）
- [ ] 使用 Playwright/Cypress 執行所有 BDD 場景
- [ ] 跨瀏覽器測試
- [ ] 跨裝置測試

### Phase 4: 效能測試（Week 3）
- [ ] Lighthouse 測試
- [ ] WebPageTest 測試
- [ ] 壓力測試（並發用戶）

---

## 📝 附錄

### BDD 測試框架建議

**推薦框架**：
1. **Playwright** (首選)
   - 優秀的跨瀏覽器支援
   - 內建錄影與截圖
   - TypeScript 原生支援

2. **Cypress**
   - 優秀的開發者體驗
   - Time-travel debugging
   - 豐富的 assertion 庫

**範例測試程式碼**：
```typescript
// tests/e2e/first-use.spec.ts
import { test, expect } from '@playwright/test';

test('新用戶首次進入網站', async ({ page }) => {
  // Given
  await page.goto('/');

  // When
  const loadTime = await page.evaluate(() => performance.now());

  // Then
  expect(loadTime).toBeLessThan(2000);
  await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible(); // 3D Canvas
});

test('授權麥克風權限', async ({ page, context }) => {
  // Grant microphone permission
  await context.grantPermissions(['microphone']);

  // Given
  await page.goto('/');

  // When
  await page.click('[data-testid="start-button"]');

  // Then
  await expect(page.locator('[data-testid="mic-icon"]')).toHaveClass(/active/);
  await expect(page.locator('[data-testid="audio-wave"]')).toBeVisible();
});
```

---

## 🔗 相關文檔

- [PRD (產品需求文件)](./PRD.md)
- [API 規格](../dev/api/)
- [測試計劃](../dev/testing/)

---

**文檔版本**: v1.0.0
**總場景數**: 18 個
**覆蓋功能**: 7 個核心功能
**下次審查**: 2025-10-24
