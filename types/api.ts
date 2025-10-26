/**
 * API Types
 */

import type { Message } from './app';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  duration?: number;
}

export interface STTRequest {
  audio: File | Blob;
  language?: string;
}

export interface STTResponse {
  transcription: string;
  duration: number;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

export interface ChatResponse {
  response: string;
  duration: number;
}

export interface TTSRequest {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export type TTSResponse = ArrayBuffer;

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    openai: boolean;
  };
}
