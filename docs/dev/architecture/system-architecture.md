# 系統架構設計文件

**專案**: AI Audio Chat Visualizer
**版本**: v1.0.0
**日期**: 2025-10-17
**狀態**: Draft

---

## 1. 架構總覽

### 1.1 高層架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js 14 Application (React 18)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   UI Layer   │  │  3D Layer    │  │ State Mgmt  │ │ │
│  │  │  (React)     │  │ (Three.js)   │  │  (Context)  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │            Service Layer                         │ │ │
│  │  │  • AudioService  • ChatService  • TTSService    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Vercel Serverless)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js API Routes                             │ │
│  │  /api/stt  │  /api/chat  │  /api/tts  │  /api/health │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Middleware Layer                               │ │
│  │  • Rate Limiting  • Error Handling  • Logging         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 OpenAI APIs                           │  │
│  │  • Whisper (STT)  • GPT-4o-mini  • TTS API          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 前端架構 (Client Layer)

### 2.1 技術棧

```typescript
{
  "framework": "Next.js 14 (App Router)",
  "ui": "React 18 + TypeScript",
  "3d": "Three.js + React Three Fiber + drei",
  "styling": "Tailwind CSS",
  "state": "React Context API",
  "http": "fetch API",
  "validation": "Zod"
}
```

### 2.2 前端目錄結構

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Home Page
│   ├── globals.css               # Global Styles
│   └── api/                      # API Routes (Backend)
│       ├── stt/route.ts          # Speech-to-Text
│       ├── chat/route.ts         # Chat Completion
│       └── tts/route.ts          # Text-to-Speech
│
├── components/                   # React Components
│   ├── ui/                       # Base UI Components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── features/                 # Feature Components
│   │   ├── AudioVisualizer/     # 3D Visualization
│   │   │   ├── index.tsx
│   │   │   ├── ParticleMode.tsx
│   │   │   ├── WaveformMode.tsx
│   │   │   └── GeometryMode.tsx
│   │   │
│   │   ├── ChatInterface/        # Chat UI
│   │   │   ├── index.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── InputControls.tsx
│   │   │
│   │   └── VoiceInput/           # Voice Recording
│   │       ├── index.tsx
│   │       ├── RecordButton.tsx
│   │       └── AudioWaveform.tsx
│   │
│   └── layouts/                  # Layout Components
│       ├── MainLayout.tsx
│       └── Header.tsx
│
├── lib/                          # Business Logic
│   ├── services/                 # API Services
│   │   ├── audio.service.ts      # Audio Recording/Processing
│   │   ├── stt.service.ts        # Speech-to-Text
│   │   ├── chat.service.ts       # Chat API
│   │   └── tts.service.ts        # Text-to-Speech
│   │
│   ├── hooks/                    # Custom Hooks
│   │   ├── useAudioRecorder.ts
│   │   ├── useChat.ts
│   │   ├── useTextToSpeech.ts
│   │   └── useVisualization.ts
│   │
│   ├── context/                  # React Context
│   │   ├── ChatContext.tsx
│   │   └── AudioContext.tsx
│   │
│   └── utils/                    # Utilities
│       ├── audio.ts              # Audio helpers
│       ├── api.ts                # API client
│       └── constants.ts          # Constants
│
├── types/                        # TypeScript Types
│   ├── chat.ts
│   ├── audio.ts
│   └── api.ts
│
└── config/                       # Configuration
    └── app.config.ts
```

### 2.3 前端資料流

```
User Action (Voice/Text Input)
        ↓
React Component (VoiceInput)
        ↓
Custom Hook (useAudioRecorder)
        ↓
Service Layer (audio.service.ts)
        ↓
API Layer (/api/stt)
        ↓
Context Update (ChatContext)
        ↓
Component Re-render
        ↓
3D Visualization Update
```

---

## 3. 後端架構 (API Layer)

### 3.1 API 端點設計

#### 3.1.1 語音轉文字 (STT)

```typescript
// POST /api/stt/transcribe
// Request
{
  "audio": File,           // multipart/form-data
  "language": "zh" | "en"  // optional
}

// Response
{
  "text": string,
  "language": string,
  "duration": number,
  "confidence": number
}

// Error Response
{
  "error": string,
  "code": "STT_ERROR" | "INVALID_AUDIO",
  "details": string
}
```

#### 3.1.2 對話生成 (Chat)

```typescript
// POST /api/chat/message
// Request
{
  "message": string,
  "history": Array<{
    role: "user" | "assistant",
    content: string
  }>,
  "stream": boolean  // optional, default: false
}

// Response (Non-streaming)
{
  "message": string,
  "usage": {
    "prompt_tokens": number,
    "completion_tokens": number,
    "total_tokens": number
  }
}

// Response (Streaming) - Server-Sent Events
data: {"delta": "Hello", "done": false}
data: {"delta": " World", "done": false}
data: {"delta": "", "done": true}
```

#### 3.1.3 文字轉語音 (TTS)

```typescript
// POST /api/tts/generate
// Request
{
  "text": string,
  "voice": "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
  "speed": number  // 0.25 - 4.0
}

// Response
Content-Type: audio/mpeg
Binary audio data (MP3)
```

#### 3.1.4 健康檢查

```typescript
// GET /api/health
// Response
{
  "status": "healthy" | "degraded" | "down",
  "timestamp": string,
  "services": {
    "openai": "up" | "down",
    "database": "up" | "down"  // future
  }
}
```

### 3.2 後端目錄結構

```
src/app/api/
├── stt/
│   └── route.ts              # STT endpoint
│
├── chat/
│   ├── route.ts              # Chat endpoint
│   └── stream/route.ts       # Chat streaming endpoint
│
├── tts/
│   └── route.ts              # TTS endpoint
│
├── health/
│   └── route.ts              # Health check
│
└── middleware/
    ├── rateLimit.ts          # Rate limiting
    ├── errorHandler.ts       # Error handling
    └── logger.ts             # Request logging
```

### 3.3 後端服務層設計

```typescript
// lib/api/openai.service.ts
export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async transcribe(audio: File, language?: string): Promise<TranscriptionResult> {
    const transcription = await this.client.audio.transcriptions.create({
      model: "whisper-1",
      file: audio,
      language: language || "auto"
    });
    return transcription;
  }

  async chat(message: string, history: ChatMessage[]): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...history, { role: "user", content: message }],
      max_tokens: 500
    });
    return response;
  }

  async generateSpeech(text: string, voice: Voice): Promise<ArrayBuffer> {
    const response = await this.client.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text
    });
    return response.arrayBuffer();
  }
}
```

---

## 4. 資料模型設計

### 4.1 核心資料結構

```typescript
// types/chat.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    audioUrl?: string;
    transcriptionConfidence?: number;
  };
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// types/audio.ts
export interface AudioRecording {
  id: string;
  blob: Blob;
  duration: number;
  mimeType: string;
  timestamp: number;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence: number;
}

// types/visualization.ts
export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  volume: number;
}

export type VisualizationMode = 'particle' | 'waveform' | 'geometry';
```

### 4.2 狀態管理架構

```typescript
// lib/context/ChatContext.tsx
interface ChatContextState {
  conversation: Conversation | null;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentAudioData: AudioData | null;
  visualizationMode: VisualizationMode;
}

interface ChatContextActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
}

type ChatContextValue = ChatContextState & ChatContextActions;

export const ChatContext = createContext<ChatContextValue | null>(null);
```

---

## 5. 3D 視覺化架構

### 5.1 Three.js 場景結構

```typescript
// components/features/AudioVisualizer/Scene.tsx
interface SceneProps {
  audioData: AudioData;
  mode: VisualizationMode;
}

function Scene({ audioData, mode }: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Visualization Components */}
      {mode === 'particle' && <ParticleVisualizer audioData={audioData} />}
      {mode === 'waveform' && <WaveformVisualizer audioData={audioData} />}
      {mode === 'geometry' && <GeometryVisualizer audioData={audioData} />}

      {/* Controls */}
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
```

### 5.2 視覺化模式設計

#### 5.2.1 粒子模式 (Particle Mode)

```typescript
function ParticleVisualizer({ audioData }: Props) {
  const points = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!points.current || !audioData) return;

    const positions = points.current.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const amplitude = audioData.frequencyData[i % audioData.frequencyData.length] / 255;
      positions.setY(i, amplitude * 5);
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(3000)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="cyan" />
    </points>
  );
}
```

---

## 6. 通訊協議設計

### 6.1 HTTP REST API

**使用場景**:
- STT (語音轉文字)
- Chat (非串流對話)
- TTS (文字轉語音)

**優點**:
- 簡單直接
- 易於除錯
- 瀏覽器原生支援

**限制**:
- 無法即時推送
- 長輪詢效率低

### 6.2 Server-Sent Events (SSE)

**使用場景**:
- Chat Streaming (串流對話)

**優點**:
- 單向即時推送
- 自動重連
- HTTP/2 友善

**實作範例**:
```typescript
// Frontend
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  appendToChatMessage(data.delta);
};

// Backend
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of openai.chat.completions.create({...})) {
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

## 7. 錯誤處理架構

### 7.1 錯誤分類

```typescript
// types/error.ts
export enum ErrorCode {
  // Client Errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Service Specific
  STT_ERROR = 'STT_ERROR',
  CHAT_ERROR = 'CHAT_ERROR',
  TTS_ERROR = 'TTS_ERROR',

  // Audio Errors
  MICROPHONE_PERMISSION_DENIED = 'MICROPHONE_PERMISSION_DENIED',
  AUDIO_RECORDING_FAILED = 'AUDIO_RECORDING_FAILED',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: number;
}
```

### 7.2 錯誤處理流程

```typescript
// lib/utils/errorHandler.ts
export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof OpenAIError) {
      return {
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: 'OpenAI service error',
        details: error.message,
        timestamp: Date.now()
      };
    }

    if (error instanceof ValidationError) {
      return {
        code: ErrorCode.INVALID_INPUT,
        message: error.message,
        timestamp: Date.now()
      };
    }

    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      timestamp: Date.now()
    };
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

---

## 8. 效能優化策略

### 8.1 前端優化

```typescript
// 1. Code Splitting
const AudioVisualizer = dynamic(() => import('./AudioVisualizer'), {
  loading: () => <LoadingSpinner />,
  ssr: false  // Three.js 不需要 SSR
});

// 2. Memoization
const ParticleVisualizer = memo(({ audioData }: Props) => {
  // Heavy computation
}, (prevProps, nextProps) => {
  return prevProps.audioData === nextProps.audioData;
});

// 3. Debounce User Input
const debouncedSendMessage = useMemo(
  () => debounce(sendMessage, 500),
  [sendMessage]
);

// 4. Web Worker for Audio Processing
const audioWorker = new Worker('/workers/audio-processor.js');
audioWorker.postMessage({ audioData });
```

### 8.2 後端優化

```typescript
// 1. Response Caching
const cache = new Map<string, CacheEntry>();

export async function GET(request: Request) {
  const cacheKey = request.url;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return Response.json(cached.data);
  }

  const data = await fetchData();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return Response.json(data);
}

// 2. Parallel API Calls
const [sttResult, chatResult] = await Promise.all([
  openai.transcribe(audio),
  openai.chat(message, history)
]);

// 3. Streaming Responses
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

---

## 9. 安全性架構

### 9.1 API 金鑰保護

```typescript
// ✅ Correct: Server-side only
// app/api/stt/route.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY  // Server environment variable
});

// ❌ Wrong: Never expose in client
// app/page.tsx
const openai = new OpenAI({
  apiKey: "sk-..."  // NEVER DO THIS
});
```

### 9.2 速率限制

```typescript
// middleware/rateLimit.ts
const rateLimiter = new Map<string, RateLimitEntry>();

export function rateLimit(req: Request, limit: number = 60) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;  // 1 minute

  const entry = rateLimiter.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  entry.count++;
  rateLimiter.set(ip, entry);

  if (entry.count > limit) {
    throw new Error('Rate limit exceeded');
  }
}
```

### 9.3 輸入驗證

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).max(20)
});

// Usage
const validated = ChatRequestSchema.parse(requestBody);
```

---

## 10. 部署架構

### 10.1 Vercel 部署配置

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1", "hkg1"],
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "NEXT_PUBLIC_APP_URL": "https://ai-audio-chat.vercel.app"
  },
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 11. 監控與日誌

### 11.1 日誌策略

```typescript
// lib/utils/logger.ts
export class Logger {
  static info(message: string, meta?: Record<string, unknown>) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }));
  }

  static error(message: string, error: unknown, meta?: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      meta,
      timestamp: new Date().toISOString()
    }));
  }
}

// Usage
Logger.info('User started recording', { userId: '123' });
Logger.error('STT API failed', error, { audioSize: audioBlob.size });
```

### 11.2 效能監控

```typescript
// lib/utils/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - start;
    Logger.info(`Performance: ${name}`, { durationMs: duration });

    if (duration > 5000) {
      Logger.error(`Slow operation: ${name}`, new Error('Performance threshold exceeded'), {
        durationMs: duration
      });
    }
  });
}

// Usage
const result = await measurePerformance('STT API Call', () =>
  openai.transcribe(audio)
);
```

---

## 12. 架構決策記錄參考

本架構設計基於以下 ADRs:

- **ADR-001**: Next.js 14 作為前端框架
- **ADR-002**: Three.js + React Three Fiber 作為 3D 引擎
- **ADR-003**: FastAPI (Serverless Functions) 作為後端
- **ADR-004**: OpenAI 作為 AI 服務提供商
- **ADR-005**: Vercel 作為部署平台

---

## 13. 後續擴展計劃

### 13.1 Phase 3+ 功能

- **WebSocket 支援**: 即時雙向通訊
- **數據持久化**: PostgreSQL/Supabase
- **用戶認證**: NextAuth.js
- **多人協作**: Socket.io
- **語音情感分析**: Azure Cognitive Services

### 13.2 可擴展性設計

- **水平擴展**: Vercel 自動擴展
- **垂直擴展**: 升級 Pro 方案 (更長 timeout)
- **服務拆分**: 獨立 WebSocket 服務
- **CDN 優化**: Cloudflare R2 for assets

---

**文檔版本**: v1.0.0
**審查狀態**: Draft
**下次審查**: Phase 2 結束時

---

**End of Document**
