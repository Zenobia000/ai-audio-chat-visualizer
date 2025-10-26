import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * OpenAI Realtime API WebSocket Client Hook
 * Handles real-time audio streaming with minimal latency
 */

export interface RealtimeConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'shimmer';
  temperature?: number;
  maxResponseTokens?: number;
}

export interface RealtimeAPIState {
  isConnected: boolean;
  isRecording: boolean;
  isAISpeaking: boolean;
  transcript: string;
  error: string | null;
}

export function useRealtimeAPI(config: RealtimeConfig = {}) {
  const [state, setState] = useState<RealtimeAPIState>({
    isConnected: false,
    isRecording: false,
    isAISpeaking: false,
    transcript: '',
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /**
   * Connect to OpenAI Realtime API WebSocket via local proxy
   */
  const connect = useCallback(async () => {
    try {
      // Connect to local WebSocket proxy server
      // The proxy handles authentication and connection to OpenAI
      const PROXY_URL = process.env.NEXT_PUBLIC_REALTIME_PROXY_URL || 'ws://localhost:8081';

      console.log(`[Realtime] Connecting to proxy: ${PROXY_URL}`);

      const ws = new WebSocket(PROXY_URL);

      ws.onopen = () => {
        console.log('[Realtime] Connected to proxy server successfully');
        console.log('[Realtime] Waiting for OpenAI connection...');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));

        // Note: Session configuration is handled by the proxy server
      };

      ws.onmessage = async (event) => {
        try {
          let data = event.data;

          // If data is a Blob, convert to text first
          if (data instanceof Blob) {
            data = await data.text();
          }

          const message = JSON.parse(data);
          console.log('[Realtime] Received message:', message.type);
          handleRealtimeEvent(message);
        } catch (error) {
          console.error('[Realtime] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Realtime] WebSocket error occurred');
        console.error('[Realtime] Error details:', error);
        // Don't set error state here - wait for onclose to determine if connection truly failed
      };

      ws.onclose = (event) => {
        console.log('[Realtime] WebSocket closed');
        console.log('[Realtime] Close code:', event.code);
        console.log('[Realtime] Close reason:', event.reason);
        console.log('[Realtime] Was clean:', event.wasClean);

        let errorMessage = '';
        // Only set error for abnormal closures
        if (event.code === 1006) {
          errorMessage = '連接異常關閉。可能是 API key 無效或網絡問題。';
        } else if (event.code === 1008) {
          errorMessage = '連接被拒絕。請確認 API key 有效。';
        } else if (!event.wasClean && event.code !== 1001 && event.code !== 1005) {
          errorMessage = `連接意外斷開 (code: ${event.code})`;
        }

        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: errorMessage || null, // Clear previous errors if closing normally
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Realtime] Connection error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to connect to Realtime API',
      }));
    }
  }, [config]);

  /**
   * Handle Realtime API events
   */
  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'session.created':
        console.log('[Realtime] Session created:', event.session.id);
        break;

      case 'session.updated':
        console.log('[Realtime] Session updated');
        break;

      case 'conversation.item.created':
        console.log('[Realtime] Item created:', event.item);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('[Realtime] User started speaking');
        setState((prev) => ({ ...prev, isRecording: true }));
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[Realtime] User stopped speaking');
        setState((prev) => ({ ...prev, isRecording: false }));
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('[Realtime] Transcription:', event.transcript);
        setState((prev) => ({ ...prev, transcript: event.transcript }));
        break;

      case 'response.audio.delta':
        // Handle audio output chunk
        playAudioChunk(event.delta);
        break;

      case 'response.audio.done':
        console.log('[Realtime] Audio response complete');
        setState((prev) => ({ ...prev, isAISpeaking: false }));
        break;

      case 'response.done':
        console.log('[Realtime] Response complete');
        break;

      case 'error':
        console.error('[Realtime] Error:', event.error);
        setState((prev) => ({ ...prev, error: event.error.message }));
        break;

      default:
        console.log('[Realtime] Unhandled event:', event.type);
    }
  };

  /**
   * Start recording audio from microphone
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);
          const base64Audio = arrayBufferToBase64(pcm16);

          // Send audio chunk to Realtime API
          wsRef.current.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('[Realtime] Failed to start recording:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to access microphone',
      }));
    }
  }, []);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Commit audio buffer to trigger AI response
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'input_audio_buffer.commit',
        })
      );

      wsRef.current.send(
        JSON.stringify({
          type: 'response.create',
        })
      );
    }

    setState((prev) => ({ ...prev, isRecording: false }));
  }, []);

  /**
   * Disconnect from Realtime API
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      isConnected: false,
      isRecording: false,
      isAISpeaking: false,
      transcript: '',
      error: null,
    });
  }, []);

  /**
   * Play audio chunk from AI response
   */
  const playAudioChunk = (base64Audio: string) => {
    // This will be implemented to play PCM16 audio chunks
    // For now, we'll log it
    console.log('[Realtime] Received audio chunk');
    setState((prev) => ({ ...prev, isAISpeaking: true }));
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  };
}

/**
 * Convert Float32Array to PCM16
 */
function convertFloat32ToPCM16(float32Array: Float32Array): ArrayBuffer {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16.buffer;
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
