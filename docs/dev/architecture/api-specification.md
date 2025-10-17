# API 規格文件

**專案**: AI Audio Chat Visualizer
**版本**: v1.0.0
**日期**: 2025-10-17
**Protocol**: REST + Server-Sent Events (SSE)

---

## 📋 API 總覽

### Base URL
```
Development:  http://localhost:3000/api
Production:   https://ai-audio-chat.vercel.app/api
```

### Authentication
MVP 階段無需認證，所有端點公開訪問（受速率限制保護）

### Rate Limiting
- **全域限制**: 60 requests/minute per IP
- **STT endpoint**: 20 requests/minute per IP
- **Chat endpoint**: 30 requests/minute per IP

---

## 🎙️ 1. Speech-to-Text API

### POST /api/stt/transcribe

將音訊檔案轉換為文字

**Request**

```http
POST /api/stt/transcribe
Content-Type: multipart/form-data

audio: File (required)
language: "zh" | "en" | "auto" (optional, default: "auto")
```

**Request Example (JavaScript)**

```typescript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('language', 'zh');

const response = await fetch('/api/stt/transcribe', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response 200 OK**

```json
{
  "text": "你好,能介紹一下你自己嗎?",
  "language": "zh",
  "duration": 3.5,
  "confidence": 0.95,
  "segments": [
    {
      "text": "你好",
      "start": 0.0,
      "end": 0.5
    },
    {
      "text": "能介紹一下你自己嗎",
      "start": 0.5,
      "end": 3.5
    }
  ]
}
```

**Error Responses**

```json
// 400 Bad Request - Invalid audio format
{
  "error": "Invalid audio format",
  "code": "INVALID_AUDIO_FORMAT",
  "details": "Supported formats: webm, mp3, wav, m4a"
}

// 413 Payload Too Large - Audio file too large
{
  "error": "Audio file too large",
  "code": "FILE_TOO_LARGE",
  "details": "Maximum file size: 25MB"
}

// 429 Too Many Requests - Rate limit exceeded
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": "Please wait 60 seconds before retrying",
  "retryAfter": 60
}

// 500 Internal Server Error - OpenAI API error
{
  "error": "Transcription failed",
  "code": "STT_ERROR",
  "details": "OpenAI API returned an error"
}
```

**Performance**
- Average latency: 2-4 seconds
- Timeout: 30 seconds

---

## 💬 2. Chat Completion API

### POST /api/chat/message

生成 AI 對話回應（非串流）

**Request**

```http
POST /api/chat/message
Content-Type: application/json

{
  "message": string,
  "history": Array<{ role: "user" | "assistant", content: string }>,
  "maxTokens": number (optional, default: 500),
  "temperature": number (optional, default: 0.7)
}
```

**Request Example**

```typescript
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "什麼是人工智慧?",
    history: [
      { role: "user", content: "你好" },
      { role: "assistant", content: "你好!我是 AI 助手" }
    ],
    maxTokens: 500,
    temperature: 0.7
  })
});

const result = await response.json();
```

**Response 200 OK**

```json
{
  "message": "人工智慧(Artificial Intelligence, AI)是指讓機器模擬人類智能的技術...",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 120,
    "totalTokens": 165
  },
  "model": "gpt-4o-mini",
  "finishReason": "stop"
}
```

**Error Responses**

```json
// 400 Bad Request - Invalid input
{
  "error": "Message is required",
  "code": "INVALID_INPUT",
  "details": "message field cannot be empty"
}

// 400 Bad Request - Message too long
{
  "error": "Message too long",
  "code": "MESSAGE_TOO_LONG",
  "details": "Maximum message length: 2000 characters"
}

// 500 Internal Server Error - OpenAI API error
{
  "error": "Chat completion failed",
  "code": "CHAT_ERROR",
  "details": "OpenAI API returned an error"
}
```

**Performance**
- Average latency: 2-5 seconds
- Timeout: 30 seconds

---

### POST /api/chat/stream

生成 AI 對話回應（串流模式）

**Request**

Same as `/api/chat/message`

**Response Headers**

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response (Server-Sent Events)**

```
data: {"delta": "人工", "done": false}

data: {"delta": "智慧", "done": false}

data: {"delta": "是", "done": false}

data: {"delta": "", "done": true, "usage": {"promptTokens": 45, "completionTokens": 120, "totalTokens": 165}}
```

**Client Example**

```typescript
const eventSource = new EventSource('/api/chat/stream?' + new URLSearchParams({
  message: "什麼是 AI?",
  history: JSON.stringify([...])
}));

let fullMessage = '';

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.done) {
    console.log('Complete message:', fullMessage);
    console.log('Usage:', data.usage);
    eventSource.close();
  } else {
    fullMessage += data.delta;
    console.log('Partial message:', fullMessage);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

**Performance**
- First token latency: 1-2 seconds
- Subsequent tokens: 50-100ms each
- Total duration: 3-10 seconds (depends on response length)

---

## 🔊 3. Text-to-Speech API

### POST /api/tts/generate

將文字轉換為語音

**Request**

```http
POST /api/tts/generate
Content-Type: application/json

{
  "text": string,
  "voice": "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
  "speed": number (0.25 - 4.0, optional, default: 1.0)
}
```

**Request Example**

```typescript
const response = await fetch('/api/tts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "人工智慧是一門令人著迷的科技",
    voice: "nova",
    speed: 1.0
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);

const audio = new Audio(audioUrl);
audio.play();
```

**Response 200 OK**

```http
Content-Type: audio/mpeg
Content-Length: 45678

<Binary audio data (MP3)>
```

**Error Responses**

```json
// 400 Bad Request - Text too long
{
  "error": "Text too long",
  "code": "TEXT_TOO_LONG",
  "details": "Maximum text length: 4096 characters"
}

// 400 Bad Request - Invalid voice
{
  "error": "Invalid voice",
  "code": "INVALID_VOICE",
  "details": "Supported voices: alloy, echo, fable, onyx, nova, shimmer"
}

// 500 Internal Server Error - OpenAI API error
{
  "error": "Speech generation failed",
  "code": "TTS_ERROR",
  "details": "OpenAI API returned an error"
}
```

**Performance**
- Average latency: 1-3 seconds
- Timeout: 30 seconds

**Voice Characteristics**

| Voice | Gender | Description | Best for |
|-------|--------|-------------|----------|
| alloy | Neutral | Balanced, versatile | General use |
| echo | Male | Clear, professional | Business, news |
| fable | Female | Warm, friendly | Storytelling |
| onyx | Male | Deep, authoritative | Narration |
| nova | Female | Energetic, upbeat | Casual conversation |
| shimmer | Female | Soft, gentle | Meditation, calm content |

---

## ❤️ 4. Health Check API

### GET /api/health

系統健康檢查

**Request**

```http
GET /api/health
```

**Response 200 OK**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T12:00:00.000Z",
  "services": {
    "openai": "up",
    "database": "up"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

**Response 503 Service Unavailable**

```json
{
  "status": "down",
  "timestamp": "2025-10-17T12:00:00.000Z",
  "services": {
    "openai": "down",
    "database": "up"
  },
  "version": "1.0.0"
}
```

---

## 🔒 5. Error Handling

### Standard Error Response Format

All API errors follow this format:

```typescript
interface APIError {
  error: string;           // Human-readable error message
  code: ErrorCode;         // Machine-readable error code
  details?: string;        // Additional error details
  timestamp?: number;      // Unix timestamp
  requestId?: string;      // Request ID for debugging
  retryAfter?: number;     // Seconds to wait before retry (for rate limits)
}
```

### Error Codes

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `INVALID_INPUT` | 400 | Invalid request parameters | No |
| `INVALID_AUDIO_FORMAT` | 400 | Unsupported audio format | No |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit | No |
| `MESSAGE_TOO_LONG` | 400 | Message exceeds length limit | No |
| `TEXT_TOO_LONG` | 400 | Text exceeds length limit | No |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Yes (after `retryAfter`) |
| `STT_ERROR` | 500 | Speech-to-text failed | Yes |
| `CHAT_ERROR` | 500 | Chat completion failed | Yes |
| `TTS_ERROR` | 500 | Text-to-speech failed | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Yes |

---

## 📊 6. Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1634567890
```

### Rate Limit Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1634567890

{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": "Please wait 60 seconds before retrying",
  "retryAfter": 60
}
```

### Client-side Handling

```typescript
async function fetchWithRateLimit(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRateLimit(url, options);  // Retry
  }

  return response;
}
```

---

## 🧪 7. Testing

### API Testing Examples

```typescript
// STT API Test
describe('POST /api/stt/transcribe', () => {
  it('should transcribe audio successfully', async () => {
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/stt/transcribe', {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('text');
    expect(data.text.length).toBeGreaterThan(0);
  });

  it('should return 400 for missing audio', async () => {
    const response = await fetch('/api/stt/transcribe', {
      method: 'POST',
      body: new FormData()
    });

    expect(response.status).toBe(400);
  });
});

// Chat API Test
describe('POST /api/chat/message', () => {
  it('should generate chat response', async () => {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hello",
        history: []
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.usage.totalTokens).toBeGreaterThan(0);
  });
});

// TTS API Test
describe('POST /api/tts/generate', () => {
  it('should generate speech audio', async () => {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "Hello",
        voice: "nova"
      })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');

    const blob = await response.blob();
    expect(blob.size).toBeGreaterThan(0);
  });
});
```

---

## 📖 8. API Usage Examples

### Complete Conversation Flow

```typescript
class AIAudioChat {
  async startConversation() {
    // 1. Record audio
    const audioBlob = await this.recordAudio();

    // 2. Transcribe audio to text
    const transcription = await this.transcribe(audioBlob);
    console.log('User said:', transcription.text);

    // 3. Get AI response
    const chatResponse = await this.chat(transcription.text);
    console.log('AI response:', chatResponse.message);

    // 4. Convert response to speech
    const speechBlob = await this.generateSpeech(chatResponse.message);

    // 5. Play speech
    await this.playAudio(speechBlob);
  }

  async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/stt/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Transcription failed');
    return response.json();
  }

  async chat(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) throw new Error('Chat failed');
    return response.json();
  }

  async generateSpeech(text: string, voice = 'nova'): Promise<Blob> {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) throw new Error('TTS failed');
    return response.blob();
  }

  async playAudio(blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
  }
}
```

---

## 🔐 9. Security Considerations

### CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};
```

### Input Validation

All endpoints validate input using Zod schemas:

```typescript
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).max(20),
  maxTokens: z.number().min(1).max(2000).optional(),
  temperature: z.number().min(0).max(2).optional()
});
```

---

## 📈 10. Performance Metrics

### Target Latencies

| Endpoint | P50 | P95 | P99 | Timeout |
|----------|-----|-----|-----|---------|
| `/api/stt/transcribe` | 2s | 4s | 6s | 30s |
| `/api/chat/message` | 3s | 6s | 10s | 30s |
| `/api/chat/stream` (first token) | 1s | 2s | 3s | 30s |
| `/api/tts/generate` | 1.5s | 3s | 5s | 30s |
| `/api/health` | 50ms | 100ms | 200ms | 5s |

### Monitoring

All endpoints emit metrics for monitoring:

```typescript
Logger.info('API request completed', {
  endpoint: '/api/stt/transcribe',
  duration: 2340,  // ms
  status: 200,
  audioSize: 1234567,  // bytes
  transcriptionLength: 45  // characters
});
```

---

**文檔版本**: v1.0.0
**審查狀態**: Draft
**下次審查**: Phase 2 結束時

---

**End of Document**
