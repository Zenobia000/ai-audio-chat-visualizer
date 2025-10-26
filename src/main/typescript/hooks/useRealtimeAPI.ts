import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * OpenAI Realtime API WebSocket Client Hook (Simplified Version)
 * Based on: https://github.com/AwaisKamran/openai-realtime-api
 *
 * Key Changes from v1:
 * - Recording: File-based approach (accumulate then send) instead of streaming
 * - Events: conversation.item.create instead of input_audio_buffer.append
 * - Simpler state management and error handling
 */

/**
 * Audio Stream Queue for smooth playback
 * (Kept from v1 - this works well)
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

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.nextStartTime = 0;
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

    source.onended = () => {
      this.currentSource = null;
      this.playNext();
    };

    this.currentSource = source;
  }

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
  const audioQueueRef = useRef<AudioStreamQueue | null>(null);

  // Recording state - accumulate audio chunks
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);

  /**
   * Connect to OpenAI Realtime API WebSocket via local proxy
   */
  const connect = useCallback(async () => {
    try {
      // Initialize audio queue for playback
      if (!audioQueueRef.current) {
        audioQueueRef.current = new AudioStreamQueue(24000, () => {
          setState((prev) => ({ ...prev, isAISpeaking: false }));
        });
        console.log('[Realtime v2] Audio queue initialized');
      }

      const PROXY_URL = process.env.NEXT_PUBLIC_REALTIME_PROXY_URL || 'ws://localhost:8081';
      console.log(`[Realtime v2] Connecting to proxy: ${PROXY_URL}`);

      const ws = new WebSocket(PROXY_URL);

      ws.onopen = () => {
        console.log('[Realtime v2] Connected to proxy server');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = async (event) => {
        try {
          let data = event.data;
          if (data instanceof Blob) {
            data = await data.text();
          }

          const message = JSON.parse(data);
          console.log('[Realtime v2] Received:', message.type);
          handleRealtimeEvent(message);
        } catch (error) {
          console.error('[Realtime v2] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Realtime v2] WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('[Realtime v2] WebSocket closed:', event.code);
        let errorMessage = '';
        if (event.code === 1006) {
          errorMessage = '連接異常關閉';
        } else if (!event.wasClean && event.code !== 1001 && event.code !== 1005) {
          errorMessage = `連接斷開 (code: ${event.code})`;
        }

        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: errorMessage || null,
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Realtime v2] Connection error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to connect to Realtime API',
      }));
    }
  }, []);

  /**
   * Handle Realtime API events
   * Based on reference project event handling
   */
  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log('[Realtime v2] Session:', event.type);
        break;

      case 'conversation.item.created':
        console.log('[Realtime v2] Item created');
        break;

      // Audio response handling (same as reference project)
      case 'response.audio.delta':
        playAudioChunk(event.delta);
        break;

      case 'response.audio.done':
        console.log('[Realtime v2] Audio response complete');
        break;

      // Transcript handling
      case 'conversation.item.input_audio_transcription.completed':
      case 'response.content_part.done':
        if (event.transcript || event.part?.transcript) {
          const transcript = event.transcript || event.part.transcript;
          console.log('[Realtime v2] Transcript:', transcript);
          setState((prev) => ({ ...prev, transcript }));
        }
        break;

      case 'response.done':
        console.log('[Realtime v2] Response complete');
        break;

      case 'error':
        console.error('[Realtime v2] Error event received:', event);
        console.error('[Realtime v2] Full error object:', JSON.stringify(event, null, 2));

        // Extract meaningful error message
        const errorMessage = event.error?.message
          || event.error?.type
          || event.error?.code
          || (event.error ? JSON.stringify(event.error) : null)
          || 'Unknown error from OpenAI Realtime API';

        setState((prev) => ({ ...prev, error: errorMessage }));
        break;

      default:
        console.log('[Realtime v2] Unhandled event:', event.type);
    }
  };

  /**
   * Start recording audio from microphone
   * Accumulates audio chunks instead of streaming
   */
  const startRecording = useCallback(async () => {
    try {
      if (mediaStreamRef.current || audioContextRef.current) {
        console.warn('[Realtime v2] Already recording');
        return;
      }

      // Clear previous recording
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      sourceRef.current = source;
      processorRef.current = processor;

      // Accumulate audio chunks (instead of sending immediately)
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Create a copy of the data
        const chunk = new Float32Array(inputData.length);
        chunk.set(inputData);
        recordedChunksRef.current.push(chunk);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('[Realtime v2] Recording started');
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('[Realtime v2] Failed to start recording:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to access microphone',
      }));
    }
  }, []);

  /**
   * Stop recording and send accumulated audio
   * Based on reference project's approach
   */
  const stopRecording = useCallback(() => {
    console.log('[Realtime v2] Stopping recording...');

    // Step 1: Disconnect audio nodes
    if (sourceRef.current && processorRef.current) {
      try {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      } catch (error) {
        console.warn('[Realtime v2] Error disconnecting nodes:', error);
      }
      sourceRef.current = null;
      processorRef.current = null;
    }

    // Step 2: Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Step 3: Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Step 4: Process and send accumulated audio
    if (recordedChunksRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log(`[Realtime v2] Processing ${recordedChunksRef.current.length} audio chunks`);

      // Concatenate all chunks into one Float32Array
      const totalLength = recordedChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Float32Array(totalLength);

      let offset = 0;
      for (const chunk of recordedChunksRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[Realtime v2] Combined audio length: ${combinedAudio.length} samples`);
      console.log(`[Realtime v2] Audio duration: ${(combinedAudio.length / 24000).toFixed(2)}s`);

      // Validate audio data
      if (combinedAudio.length === 0) {
        console.error('[Realtime v2] ERROR: No audio data recorded!');
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: 'No audio data captured. Please try again.',
        }));
        recordedChunksRef.current = [];
        return;
      }

      // Check if audio has actual signal (not just silence)
      const maxAmplitude = Math.max(...Array.from(combinedAudio).map(Math.abs));
      console.log(`[Realtime v2] Max amplitude: ${maxAmplitude.toFixed(4)}`);

      if (maxAmplitude < 0.001) {
        console.warn('[Realtime v2] WARNING: Audio appears to be silent (max amplitude < 0.001)');
      }

      // Convert to PCM16 and Base64 (same as reference project)
      const base64Audio = convertFloat32ToBase64(combinedAudio);
      console.log(`[Realtime v2] Base64 audio length: ${base64Audio.length} characters`);

      // Log first few characters for debugging
      console.log(`[Realtime v2] Base64 preview: ${base64Audio.substring(0, 50)}...`);

      // Send as conversation item (reference project approach)
      console.log('[Realtime v2] Sending conversation item...');
      const conversationItem = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_audio',
              audio: base64Audio,
            },
          ],
        },
      };

      console.log('[Realtime v2] Payload structure:', JSON.stringify(conversationItem, null, 2).substring(0, 200) + '...');
      wsRef.current.send(JSON.stringify(conversationItem));

      // Request response
      console.log('[Realtime v2] Requesting AI response...');
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));

      // Clear recorded chunks
      recordedChunksRef.current = [];
    } else if (recordedChunksRef.current.length === 0) {
      console.warn('[Realtime v2] No audio chunks to send');
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: 'Recording too short. Please speak longer.',
      }));
    }

    setState((prev) => ({ ...prev, isRecording: false }));
  }, []);

  /**
   * Disconnect from Realtime API
   */
  const disconnect = useCallback(() => {
    // Clean up recording
    if (sourceRef.current && processorRef.current) {
      try {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      } catch (error) {
        // Ignore
      }
      sourceRef.current = null;
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

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

    recordedChunksRef.current = [];

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
      await audioQueueRef.current.enqueue(base64Audio);
      setState((prev) => ({ ...prev, isAISpeaking: true }));
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
 * Convert Float32Array to Base64
 * Based on reference project's implementation
 */
function convertFloat32ToBase64(float32Array: Float32Array): string {
  // Convert to PCM16
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Convert to Base64
  const bytes = new Uint8Array(pcm16.buffer);
  const len = bytes.byteLength;
  let binary = '';

  // Process in chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}
