/**
 * WebSocket Proxy Server for OpenAI Realtime API
 *
 * This server acts as a proxy between the browser and OpenAI Realtime API
 * to bypass CORS restrictions and handle authentication securely.
 */

const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const PORT = process.env.REALTIME_PROXY_PORT || 8081;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('[Proxy] ERROR: OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OpenAI Realtime API WebSocket Proxy Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log(`[Proxy] WebSocket Proxy Server starting on port ${PORT}...`);

// Handle client connections
wss.on('connection', (clientWs) => {
  console.log('[Proxy] New client connected');

  let openaiWs = null;

  // Connect to OpenAI Realtime API
  try {
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

    openaiWs = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    // OpenAI connection opened
    openaiWs.on('open', () => {
      console.log('[Proxy] Connected to OpenAI Realtime API');

      // Send initial session configuration
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: 'You are a helpful AI assistant. Respond naturally and conversationally in Traditional Chinese.',
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          temperature: 0.8,
          max_response_output_tokens: 4096,
        },
      };

      openaiWs.send(JSON.stringify(sessionConfig));
      console.log('[Proxy] Sent initial session configuration');
    });

    // Forward messages from OpenAI to client
    openaiWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[Proxy] OpenAI → Client: ${message.type}`);

        // Log error details for debugging
        if (message.type === 'error') {
          console.error('[Proxy] OpenAI Error Details:', JSON.stringify(message.error, null, 2));
        }

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(data);
        }
      } catch (error) {
        console.error('[Proxy] Error parsing OpenAI message:', error);
      }
    });

    // Handle OpenAI connection errors
    openaiWs.on('error', (error) => {
      console.error('[Proxy] OpenAI WebSocket error:', error.message);

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: {
            message: 'OpenAI connection error',
            code: 'proxy_error',
          },
        }));
      }
    });

    // Handle OpenAI connection close
    openaiWs.on('close', (code, reason) => {
      console.log(`[Proxy] OpenAI connection closed: ${code} - ${reason}`);

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, 'OpenAI connection closed');
      }
    });

  } catch (error) {
    console.error('[Proxy] Failed to connect to OpenAI:', error.message);
    clientWs.close(1011, 'Failed to connect to OpenAI');
    return;
  }

  // Forward messages from client to OpenAI
  clientWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[Proxy] Client → OpenAI: ${message.type}`);

      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(data);
      } else {
        console.warn('[Proxy] OpenAI connection not ready, message dropped');
      }
    } catch (error) {
      console.error('[Proxy] Error parsing client message:', error);
    }
  });

  // Handle client disconnection
  clientWs.on('close', (code, reason) => {
    console.log(`[Proxy] Client disconnected: ${code} - ${reason}`);

    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close(1000, 'Client disconnected');
    }
  });

  // Handle client errors
  clientWs.on('error', (error) => {
    console.error('[Proxy] Client WebSocket error:', error.message);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[Proxy] ✅ WebSocket Proxy Server running on ws://localhost:${PORT}`);
  console.log(`[Proxy] Forwarding to: wss://api.openai.com/v1/realtime`);
  console.log(`[Proxy] Press Ctrl+C to stop`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Proxy] Shutting down gracefully...');
  wss.close(() => {
    console.log('[Proxy] WebSocket server closed');
    server.close(() => {
      console.log('[Proxy] HTTP server closed');
      process.exit(0);
    });
  });
});
