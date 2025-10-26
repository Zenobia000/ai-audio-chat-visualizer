import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * OpenAI Realtime API WebSocket Client Hook
 * Handles real-time audio streaming with minimal latency
 */

/**
 * Audio Stream Queue for smooth playback
 * Manages continuous audio chunks to prevent gaps and stuttering
 */
class AudioStreamQueue {
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextStartTime = 0;
  private onQueueEmpty?: () => void;

  constructor(sampleRate = 24000, onQueueEmpty?: () => void) {
    this.audioContext = new AudioContext({ sampleRate });
    this.onQueueEmpty = onQueueEmpty;
  }

  /**
   * Add audio chunk to queue and play if not already playing
   */
  async enqueue(base64Audio: string): Promise<void> {
    try {
      // Convert Base64 to PCM16
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        float32.length,
        this.audioContext.sampleRate
      );
      audioBuffer.getChannelData(0).set(float32);

      this.queue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error('[AudioQueue] Failed to enqueue audio:', error);
    }
  }

  /**
   * Play next audio chunk from queue
   */
  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.nextStartTime = 0;
      // Notify that queue is empty
      if (this.onQueueEmpty) {
        this.onQueueEmpty();
      }
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Schedule playback for smooth streaming
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    // Schedule next chunk
    source.onended = () => {
      this.currentSource = null;
      this.playNext();
    };

    this.currentSource = source;
  }

  /**
   * Stop playback and clear queue
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Ignore if already stopped
      }
      this.currentSource = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }

  /**
   * Close audio context
   */
  close(): void {
    this.stop();
    this.audioContext.close();
  }
}

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
  const audioQueueRef = useRef<AudioStreamQueue | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /**
   * Connect to OpenAI Realtime API WebSocket via local proxy
   */
  const connect = useCallback(async () => {
    try {
      // Initialize audio queue for playback
      if (!audioQueueRef.current) {
        audioQueueRef.current = new AudioStreamQueue(24000, () => {
          // Callback when audio queue is empty (all chunks played)
          setState((prev) => ({ ...prev, isAISpeaking: false }));
        });
        console.log('[Realtime] Audio queue initialized');
      }

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
        // Note: isAISpeaking will be set to false after queue finishes playing
        // We don't set it here immediately to avoid premature state change
        break;

      case 'response.done':
        console.log('[Realtime] Response complete');
        break;

      case 'error':
        console.error('[Realtime] Error event received:', event);
        console.error('[Realtime] Error details:', JSON.stringify(event.error, null, 2));

        const errorMessage = event.error?.message
          || event.error?.type
          || 'Unknown error occurred';

        setState((prev) => ({ ...prev, error: errorMessage }));
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
      // Don't start if already recording
      if (mediaStreamRef.current || audioContextRef.current) {
        console.warn('[Realtime] Already recording');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      console.log('[Realtime] AudioContext sample rate:', audioContext.sampleRate);

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // Save references for cleanup
      sourceRef.current = source;
      processorRef.current = processor;

      let audioChunkCount = 0;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToPCM16(inputData);
          const base64Audio = arrayBufferToBase64(pcm16);

          if (audioChunkCount === 0) {
            console.log('[Realtime] First audio chunk:', {
              samples: inputData.length,
              pcm16Size: pcm16.byteLength,
              base64Length: base64Audio.length,
            });
          }
          audioChunkCount++;

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

      console.log('[Realtime] Recording started');
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
    console.log('[Realtime] Stopping recording...');

    // Step 1: Disconnect audio nodes first to stop processing
    if (sourceRef.current && processorRef.current) {
      try {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
        console.log('[Realtime] Audio nodes disconnected');
      } catch (error) {
        console.warn('[Realtime] Error disconnecting nodes:', error);
      }
      sourceRef.current = null;
      processorRef.current = null;
    }

    // Step 2: Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      console.log('[Realtime] Media stream stopped');
    }

    // Step 3: Commit audio buffer and request response
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Realtime] Committing audio buffer...');
      wsRef.current.send(
        JSON.stringify({
          type: 'input_audio_buffer.commit',
        })
      );

      console.log('[Realtime] Requesting AI response...');
      wsRef.current.send(
        JSON.stringify({
          type: 'response.create',
        })
      );
    }

    // Step 4: Close audio context (async cleanup)
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        console.log('[Realtime] AudioContext closed');
      });
      audioContextRef.current = null;
    }

    console.log('[Realtime] Recording stopped');
    setState((prev) => ({ ...prev, isRecording: false }));
  }, []);

  /**
   * Disconnect from Realtime API
   */
  const disconnect = useCallback(() => {
    // Disconnect audio nodes
    if (sourceRef.current && processorRef.current) {
      try {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      } catch (error) {
        // Ignore errors during cleanup
      }
      sourceRef.current = null;
      processorRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clean up audio queue
    if (audioQueueRef.current) {
      audioQueueRef.current.close();
      audioQueueRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
  const playAudioChunk = async (base64Audio: string) => {
    if (audioQueueRef.current) {
      console.log('[Realtime] Playing audio chunk');
      await audioQueueRef.current.enqueue(base64Audio);
      setState((prev) => ({ ...prev, isAISpeaking: true }));
    } else {
      console.warn('[Realtime] Audio queue not initialized');
    }
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
 * Using proper binary-to-base64 conversion for PCM16 audio data
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  let binary = '';

  // Process in chunks to avoid stack overflow with large arrays
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}
