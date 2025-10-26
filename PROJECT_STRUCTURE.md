# 📁 AI Audio Chat Visualizer - 完整專案結構指南

> **專案版本**: 2.0
> **最後更新**: 2025-10-26
> **總檔案數**: ~2,400
> **總目錄數**: ~1,100

---

## 🎯 專案概覽

**AI Audio Chat Visualizer** 是一個透過 3D 視覺化增強 AI 語音互動體驗的應用程式。結合 Next.js 前端、FastAPI 後端、Three.js 3D 視覺化和 OpenAI APIs。

### 📊 專案統計

| 類別 | 說明 |
|------|------|
| **前端技術** | Next.js 14+ / React 18 / TypeScript / Three.js |
| **後端技術** | Python / FastAPI / OpenAI SDK |
| **AI 服務** | Whisper (STT) / GPT (Chat) / TTS (語音合成) |
| **部署** | Vercel (前端) + Python Server (後端) |
| **專案管理** | TaskMaster Hub + Claude Code + VibeCoding 範本 |

---

## 📁 完整目錄結構 (3 層級)

```
ai-audio-chat-visualizer/
│
├── 📄 核心配置與文檔
│   ├── README.md                          # 專案總覽和快速開始
│   ├── README.project.md                  # 專案詳細說明
│   ├── CLAUDE.md                          # Claude Code 工作流規則 ⭐
│   ├── PROJECT_STRUCTURE.md               # 本檔案：專案結構指南
│   ├── MCP_SETUP_GUIDE.md                 # MCP 服務設定指南
│   ├── LICENSE                            # MIT 開源授權
│   ├── .gitignore                         # Git 忽略檔案配置
│   ├── .env.example                       # 環境變數範本
│   ├── .env                               # 環境變數（本地開發）
│   ├── .mcp.json                          # MCP 服務配置
│   └── .eslintrc.json                     # ESLint 設定
│
├── 🤖 .claude/                            # TaskMaster 核心系統 (完整集成)
│   ├── 🚀 taskmaster.js                   # TaskMaster 核心引擎
│   ├── 📋 GETTING_STARTED.md              # 初學者指南
│   ├── 🏗️ ARCHITECTURE.md                # 系統架構設計文檔
│   ├── 🤖 TASKMASTER_README.md            # TaskMaster 技術文檔
│   ├── 🆘 TROUBLESHOOTING.md              # 故障排除指南
│   ├── 🔗 SUBAGENT_INTEGRATION_GUIDE.md   # Subagent 整合說明
│   ├── 📄 settings.local.json             # Claude Code 本地設定
│   ├── 📄 hooks-config.json               # Hooks 設定檔案
│   ├── 📄 hooks.log                       # Hooks 執行日誌
│   │
│   ├── 🎛️ commands/                      # TaskMaster 指令系統 (8個)
│   │   ├── task-init.md                   # 專案初始化指令
│   │   ├── task-status.md                 # 狀態查詢指令
│   │   ├── task-next.md                   # 下個任務建議
│   │   ├── hub-delegate.md                # Hub 協調委派
│   │   ├── review-code.md                 # 程式碼審查指令
│   │   ├── check-quality.md               # 品質檢查指令
│   │   ├── suggest-mode.md                # 建議密度調整
│   │   └── template-check.md              # 範本驗證指令
│   │
│   ├── 🤖 agents/                        # Claude Code Subagents (8個)
│   │   ├── general-purpose.md             # 通用任務智能體
│   │   ├── code-quality-specialist.md     # 程式碼品質專家
│   │   ├── test-automation-engineer.md    # 測試自動化工程師
│   │   ├── security-infrastructure-auditor.md # 安全稽核員
│   │   ├── deployment-expert.md           # 部署專家
│   │   ├── documentation-specialist.md    # 文檔專家
│   │   ├── e2e-validation-specialist.md   # 端到端驗證專家
│   │   └── workflow-template-manager.md   # 工作流管理員
│   │
│   ├── 📊 output-styles/                  # VibeCoding 輸出樣式 (14個範本)
│   │   ├── 01-prd-product-spec.md         # 產品需求規格
│   │   ├── 02-bdd-scenario-spec.md        # BDD 場景規格
│   │   ├── 03-architecture-design-doc.md  # 架構設計文檔
│   │   ├── 04-ddd-aggregate-spec.md       # DDD 聚合規格
│   │   ├── 05-api-contract-spec.md        # API 契約規格
│   │   ├── 06-tdd-unit-spec.md            # TDD 單元測試規格
│   │   ├── 07-code-review-checklist.md    # 程式碼審查清單
│   │   ├── 08-security-checklist.md       # 安全檢查清單
│   │   ├── 09-database-schema-spec.md     # 資料庫綱要規格
│   │   ├── 10-backend-python-impl.md      # Python 後端實作範本
│   │   ├── 11-frontend-component-bdd.md   # React 元件 BDD
│   │   ├── 12-integration-contract-suite.md # 整合契約套件
│   │   ├── 13-data-contract-evolution.md  # 資料契約演化
│   │   └── 14-ci-quality-gates.md         # CI 品質閘門
│   │
│   ├── 📁 context/                        # 跨智能體上下文共享
│   │   ├── README.md                      # Context 管理指南
│   │   ├── decisions/                     # 技術決策記錄 (ADR)
│   │   │   └── README.md                  # ADR 管理指南
│   │   ├── quality/                       # 程式碼品質報告
│   │   ├── testing/                       # 測試執行報告
│   │   ├── e2e/                           # 端到端測試報告
│   │   ├── security/                      # 安全稽核報告
│   │   ├── deployment/                    # 部署維運報告
│   │   ├── docs/                          # 文檔管理報告
│   │   └── workflow/                      # 工作流程管理報告
│   │
│   ├── 💾 taskmaster-data/                # TaskMaster 專案資料
│   │   ├── project.json                   # 專案配置檔案
│   │   └── wbs-todos.json                 # WBS Todo 清單狀態
│   │
│   ├── 🪝 hooks/                          # Claude Code Hooks
│   │   ├── hook-utils.sh                  # Hooks 工具庫
│   │   ├── session-start.sh                # 會話啟動 Hook
│   │   ├── user-prompt-submit.sh           # 提示提交 Hook
│   │   ├── pre-tool-use.sh                 # 工具使用前 Hook
│   │   ├── post-write.sh                   # 檔案寫入後 Hook
│   │   └── README.md                      # Hooks 說明文檔
│   │
│   └── 🗃️ ARCHIVE/                        # 舊檔案歸檔區
│       ├── duplicated-claude-dir/         # 重複的舊 .claude 目錄
│       └── old-template-docs/             # 舊版本文檔 (參考用)
│
├── 🎨 VibeCoding_Workflow_Templates/      # VibeCoding 企業級範本庫 (17個)
│   ├── INDEX.md                           # 範本索引和使用說明
│   ├── output_style.md                    # 輸出樣式指南
│   ├── 00_workflow_manual.md               # 工作流程手冊
│   ├── 01_development_workflow_cookbook.md # 開發工作流食譜
│   ├── 02_project_brief_and_prd.md        # 專案簡報與 PRD
│   ├── 03_behavior_driven_development_guide.md # BDD 行為驅動開發
│   ├── 04_architecture_decision_record_template.md # ADR 架構決策記錄
│   ├── 05_architecture_and_design_document.md # 架構與設計文檔
│   ├── 06_api_design_specification.md     # API 設計規格
│   ├── 07_module_specification_and_tests.md # 模組規格與測試
│   ├── 08_project_structure_guide.md      # 專案結構指南
│   ├── 09_file_dependencies_template.md   # 檔案依賴範本
│   ├── 10_class_relationships_template.md # 類別關係範本
│   ├── 11_code_review_and_refactoring_guide.md # 程式碼審查與重構
│   ├── 12_frontend_architecture_specification.md # 前端架構規格
│   ├── 13_security_and_readiness_checklists.md # 安全與就緒檢查
│   ├── 14_deployment_and_operations_guide.md # 部署與維運指南
│   ├── 15_documentation_and_maintenance_guide.md # 文檔與維護指南
│   ├── 16_wbs_development_plan_template.md # WBS 開發計畫範本
│   └── 17_frontend_information_architecture_template.md # 前端資訊架構
│
├── 📚 docs/                               # 專案文檔與規格
│   ├── WBS-Development-Plan.md            # 工作分解結構開發計畫
│   ├── api/                               # API 文檔
│   ├── user/                              # 使用者文檔
│   │   ├── PRD.md                         # 產品需求文檔
│   │   └── BDD-Scenarios.md               # BDD 使用者場景
│   └── dev/                               # 開發者文檔
│       ├── adr/                           # 架構決策記錄
│       └── architecture/                  # 架構設計文檔
│           ├── backend-structure.md       # 後端結構設計
│           ├── frontend-structure.md      # 前端結構設計
│           ├── frontend-information-architecture.md # 前端資訊架構
│           └── data-models.md             # 資料模型定義
│
├── 💻 src/                                # 源代碼目錄 ⭐ (嚴格遵循)
│   ├── main/                              # 主要實作程式碼
│   │   ├── typescript/                    # 前端程式碼 (Next.js/React/Three.js)
│   │   │   ├── components/                # React 元件庫
│   │   │   │   ├── atoms/                 # 原子級元件
│   │   │   │   ├── molecules/             # 分子級元件
│   │   │   │   ├── organisms/             # 生物級元件
│   │   │   │   └── templates/             # 頁面模板
│   │   │   ├── hooks/                     # Custom React Hooks
│   │   │   ├── contexts/                  # React Context API
│   │   │   ├── services/                  # API 服務層
│   │   │   │   └── api/                   # API 呼叫邏輯
│   │   │   ├── types/                     # TypeScript 型別定義
│   │   │   ├── utils/                     # 工具函式
│   │   │   ├── lib/                       # 第三方函式庫整合
│   │   │   │   ├── api/                   # API 客戶端
│   │   │   │   ├── audio/                 # 音訊處理
│   │   │   │   ├── openai/                # OpenAI 整合
│   │   │   │   └── utils/                 # 工具函式
│   │   │   └── pages/                     # Next.js 頁面
│   │   │
│   │   ├── python/                        # 後端程式碼 (FastAPI)
│   │   │   ├── core/                      # 核心業務邏輯
│   │   │   ├── services/                  # AI 服務整合
│   │   │   │   └── openai/                # OpenAI API 整合
│   │   │   ├── models/                    # 資料模型與 Pydantic 定義
│   │   │   ├── api/                       # FastAPI 路由與端點
│   │   │   ├── utils/                     # 資料處理與工具函式
│   │   │   └── __init__.py                # Python 套件初始化
│   │   │
│   │   └── resources/                     # 非程式碼資源
│   │       ├── config/                    # 設定檔案
│   │       ├── data/                      # 範例與種子資料
│   │       └── assets/                    # 靜態資產
│   │
│   └── test/                              # 測試程式碼
│       ├── unit/                          # 單元測試
│       │   ├── components/                # React 元件測試
│       │   ├── hooks/                     # Hooks 測試
│       │   ├── lib/                       # 函式庫測試
│       │   └── services/                  # 服務層測試
│       ├── integration/                   # 整合測試
│       │   └── api/                       # API 整合測試
│       ├── e2e/                           # 端到端測試
│       │   └── scenarios/                 # 使用者場景測試
│       └── fixtures/                      # 測試資料與 Mocks
│
├── 🎨 app/                                # Next.js App Router (現代架構)
│   ├── api/                               # API 路由
│   │   ├── chat/                          # 聊天端點
│   │   ├── stt/                           # 語音轉文字端點
│   │   ├── tts/                           # 文字轉語音端點
│   │   └── health/                        # 健康檢查端點
│   ├── layout.tsx                         # 根 Layout
│   ├── page.tsx                           # 首頁
│   ├── globals.css                        # 全局樣式
│   └── fonts/                             # 字體資源
│
├── 🎨 components/                         # React 元件目錄 (快速參考)
│   ├── atoms/                             # 基礎元件
│   ├── molecules/                         # 組合元件
│   ├── organisms/                         # 複雜元件
│   └── templates/                         # 頁面模板
│
├── 🪝 hooks/                              # Custom Hooks 目錄 (快速參考)
│   └── [各種 custom hooks]
│
├── 📦 lib/                                # 函式庫與工具 (快速參考)
│   ├── api/                               # API 客戶端
│   ├── audio/                             # 音訊處理
│   ├── openai/                            # OpenAI 集成
│   └── utils/                             # 工具函式
│
├── 🏗️ three/                              # Three.js 3D 視覺化
│   ├── scenes/                            # Three.js 場景
│   ├── visualizers/                       # 視覺化器 (音訊、波形等)
│   ├── materials/                         # 材質與著色器
│   │   └── {shaders}/                     # GLSL 著色器檔案
│   ├── hooks/                             # Three.js 相關 Hooks
│   └── utils/                             # Three.js 工具函式
│
├── 📊 data/                               # 資料集與樣本
│   ├── raw/                               # 原始音訊檔案
│   ├── processed/                         # 處理後的資料
│   ├── external/                          # 外部資料來源
│   └── temp/                              # 臨時處理檔案
│
├── 🧪 tests/                              # 測試目錄 (快速參考)
│   ├── unit/                              # 單元測試
│   ├── integration/                       # 整合測試
│   └── e2e/                               # 端到端測試
│
├── 📓 notebooks/                          # Jupyter Notebooks (實驗)
│   ├── experiments/                       # 實驗筆記本
│   ├── exploratory/                       # 探索性分析
│   └── reports/                           # 報告筆記本
│
├── 🎓 examples/                           # 使用範例
│   └── [各種範例程式碼]
│
├── 🔬 experiments/                        # 實驗與研究
│   ├── configs/                           # 實驗設定
│   ├── logs/                              # 實驗日誌
│   └── results/                           # 實驗結果
│
├── 🤖 models/                             # ML 模型與檢查點
│   ├── trained/                           # 已訓練的模型
│   ├── checkpoints/                       # 模型檢查點
│   └── metadata/                          # 模型元資料
│
├── 📋 scripts/                            # 自動化腳本
│   └── [各種開發與部署腳本]
│
├── 🛠️ tools/                              # 開發工具與實用程式
│   └── [各種開發工具]
│
├── 📁 output/                             # 產生的輸出檔案
│   └── [由程式生成的檔案]
│
├── 📁 tmp/                                # 暫存檔案
│   └── [臨時檔案]
│
├── 📁 logs/                               # 應用程式日誌
│   └── [執行時日誌]
│
├── build/                                 # Next.js 建置輸出
│   └── [編譯生成的檔案]
│
├── dist/                                  # 分發版本輸出
│   └── [打包生成的檔案]
│
├── 🔧 配置檔案
│   ├── tsconfig.json                      # TypeScript 設定
│   ├── next.config.js                     # Next.js 設定
│   ├── tailwind.config.ts                 # Tailwind CSS 設定
│   ├── postcss.config.js                  # PostCSS 設定
│   ├── package.json                       # Node.js 依賴
│   ├── package-lock.json                  # 依賴鎖定檔
│   ├── pyproject.toml                     # Python 專案配置
│   ├── poetry.lock                        # Python 依賴鎖定檔
│   └── .eslintrc.json                     # ESLint 設定
│
└── 🔐 環境與部署
    ├── .env                               # 本地環境變數
    ├── .env.example                       # 環境變數範本
    ├── vercel.json                        # Vercel 部署設定 (如果存在)
    └── .github/                           # GitHub 工作流 (如果存在)
```

---

## 🗂️ 主要目錄詳細說明

### 1️⃣ **src/ - 源代碼的唯一入口** ⭐

**嚴格規則**:
- **絕不**在根目錄建立新的程式碼檔案
- 所有源代碼必須在 `src/main/` 下
- 前端代碼: `src/main/typescript/`
- 後端代碼: `src/main/python/`
- 測試代碼: `src/test/`

**結構**:
```
src/
├── main/
│   ├── typescript/     # React/Next.js 代碼
│   ├── python/         # FastAPI 代碼
│   └── resources/      # 配置和資源
└── test/
    ├── unit/           # 單元測試
    ├── integration/    # 整合測試
    ├── e2e/            # 端到端測試
    └── fixtures/       # 測試資料
```

### 2️⃣ **.claude/ - TaskMaster 系統核心**

**用途**: Claude Code 的自動化協作和專案管理系統

**關鍵檔案**:
- `taskmaster.js` - 核心引擎
- `taskmaster-data/` - 專案狀態 (JSON)
- `commands/` - 自訂指令 (8個)
- `agents/` - Subagent 配置 (8個)
- `context/` - 跨代理上下文

### 3️⃣ **VibeCoding_Workflow_Templates/ - 企業級範本庫**

**用途**: 標準化工作流和文檔模板

**包含 17 個範本**:
- PRD 和 BDD 規格
- 架構決策記錄 (ADR)
- API 設計規格
- 安全檢查清單
- CI/CD 配置
- 等等...

### 4️⃣ **app/ - Next.js App Router**

**用途**: 現代的 Next.js 應用框架

**結構**:
- `api/` - API 路由 (Chat, STT, TTS)
- `page.tsx` - 首頁
- `layout.tsx` - 根 Layout
- `globals.css` - 全局樣式

### 5️⃣ **three/ - 3D 視覺化**

**用途**: Three.js 的所有視覺化相關代碼

**包含**:
- `scenes/` - 3D 場景定義
- `visualizers/` - 音訊視覺化器
- `materials/` - 著色器與材質
- `utils/` - Three.js 工具函式

### 6️⃣ **docs/ - 專案文檔**

**包含**:
- 產品需求 (PRD)
- BDD 場景定義
- 架構設計文檔
- ADR (架構決策記錄)

---

## 🔄 工作流指南

### 開發工作流程

```
1. 閱讀 CLAUDE.md → 了解規則
2. 使用 /task-status → 查看當前進度
3. 使用 /task-next → 獲得下個任務建議
4. 開發代碼 (src/main/ 中)
5. 執行測試 (src/test/ 中)
6. 使用 /review-code → 程式碼審查
7. Git 提交 (Conventional Commits)
8. Git Push → GitHub 自動備份
```

### 提交規範

使用 **Conventional Commits** 格式:

```bash
feat(component): add new feature
fix(api): resolve bug
docs(readme): update documentation
refactor(utils): simplify logic
test(hooks): add unit tests
```

詳見 `CLAUDE.md` 的完整提交規範。

---

## 🎯 快速參考

### 重要檔案位置

| 檔案 | 位置 | 用途 |
|------|------|------|
| 工作流規則 | `CLAUDE.md` | 必讀！開發規範 |
| 前端代碼 | `src/main/typescript/` | React/Next.js 代碼 |
| 後端代碼 | `src/main/python/` | FastAPI 代碼 |
| 測試代碼 | `src/test/` | 所有測試 |
| 3D 視覺化 | `three/` | Three.js 代碼 |
| API 端點 | `app/api/` | Next.js API 路由 |
| 文檔 | `docs/` | 專案文檔 |
| TaskMaster | `.claude/` | 自動化協作系統 |

### 常用指令

```bash
# 檢查專案狀態
/task-status

# 獲得下個任務
/task-next

# 程式碼審查
/review-code src/main/typescript

# 品質檢查
/check-quality

# 查看特定範本
/template-check 02_project_brief_and_prd
```

---

## 📊 開發環境設定

### 必要工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 前端開發 |
| Python | 3.10+ | 後端開發 |
| npm | 9+ | 前端套件管理 |
| Poetry | 1.4+ | Python 套件管理 |
| Git | 2.30+ | 版本控制 |

### 安裝依賴

```bash
# 前端依賴
npm install

# 後端依賴 (在 src/main/python/ 目錄)
poetry install
```

---

## 🚀 部署說明

### 前端部署 (Vercel)

```bash
git push origin main
# → 自動觸發 Vercel 部署
```

### 後端部署

```bash
# 在 src/main/python/ 中啟動 FastAPI
poetry run uvicorn main:app --reload
```

---

## 📌 重點規則檢查清單

在開始工作前，確認以下事項:

- [ ] ✅ 已閱讀 `CLAUDE.md`
- [ ] ✅ 已理解「絕不在根目錄建立代碼檔案」規則
- [ ] ✅ 前端代碼應在 `src/main/typescript/`
- [ ] ✅ 後端代碼應在 `src/main/python/`
- [ ] ✅ 測試代碼應在 `src/test/`
- [ ] ✅ 所有提交必須遵循 Conventional Commits
- [ ] ✅ 提交後必須執行 `git push origin main`
- [ ] ✅ 使用 TaskMaster 指令進行協作

---

## 🆘 常見問題

### Q: 我應該在哪裡建立新檔案?

**A**: 根據檔案類型:
- 前端代碼 → `src/main/typescript/`
- 後端代碼 → `src/main/python/`
- 測試 → `src/test/`
- 文檔 → `docs/`
- 範本 → `VibeCoding_Workflow_Templates/` (不建議修改)

### Q: 什麼時候使用 Subagent?

**A**: 根據 CLAUDE.md 的協作決策樹:
- 程式碼品質 → `code-quality-specialist`
- 安全性 → `security-infrastructure-auditor`
- 測試 → `test-automation-engineer`
- 部署 → `deployment-expert`
- 文檔 → `documentation-specialist`

### Q: 如何提交程式碼?

**A**:
```bash
git add .
git commit -m "feat(feature-name): description"
git push origin main
```

詳見 CLAUDE.md 的完整 Conventional Commits 規範。

---

## 📚 進階參考

更多詳細資訊請查看:

- **工作流規則**: 讀取 `CLAUDE.md`
- **TaskMaster 系統**: 查看 `.claude/ARCHITECTURE.md`
- **VibeCoding 範本**: 查看 `VibeCoding_Workflow_Templates/INDEX.md`
- **API 文檔**: 查看 `docs/api/`
- **開發指南**: 查看 `VibeCoding_Workflow_Templates/01_development_workflow_cookbook.md`

---

**⭐ 核心原則: 簡潔、標準化、人類主導** ⭐