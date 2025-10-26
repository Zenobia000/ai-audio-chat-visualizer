'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRealtimeAPI } from '@/src/main/typescript/hooks/useRealtimeAPI';

export default function RealtimePage() {
  const { state, connect, disconnect, startRecording, stopRecording } = useRealtimeAPI({
    voice: 'alloy',
    temperature: 0.8,
  });

  useEffect(() => {
    // Auto-connect on mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            AI Realtime Voice Chat
          </h1>
          <p className="text-gray-600">
            極低延遲語音對話 (&lt; 1 秒) - Powered by GPT-4o Realtime API
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="text-blue-500 hover:underline text-sm"
            >
              ← 返回傳統模式（REST API）
            </Link>
          </div>
        </div>

        {/* Connection Status */}
        <div className="text-center">
          {state.isConnected ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span>已連接到 Realtime API</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span>正在連接...</span>
            </div>
          )}
        </div>

        {/* Microphone Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={!state.isConnected || state.isAISpeaking}
            className={`
              w-32 h-32 rounded-full text-white font-bold text-lg
              transition-all duration-200 transform
              ${state.isRecording
                ? 'bg-red-500 scale-110 animate-pulse'
                : 'bg-blue-500 hover:scale-105'
              }
              ${!state.isConnected || state.isAISpeaking
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg active:scale-95'
              }
            `}
          >
            {state.isRecording
              ? '🎤 錄音中'
              : state.isAISpeaking
              ? '🔊 AI 回應中'
              : '🎤 按住說話'
            }
          </button>

          {/* Status Indicators */}
          {state.isRecording && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>正在錄音...</span>
            </div>
          )}

          {state.isAISpeaking && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI 正在回應...</span>
            </div>
          )}
        </div>

        {/* Status & Messages */}
        <div className="space-y-4">
          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {state.error}</p>
            </div>
          )}

          {state.transcript && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">你說：</p>
              <p className="text-gray-900">{state.transcript}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>💡 按住麥克風按鈕說話，放開後 AI 立即回應</p>
          <p>⚡ 延遲 &lt; 1 秒（vs 傳統模式 10-15 秒）</p>
          <p className="mt-4 text-xs">
            🎯 使用 OpenAI GPT-4o Realtime API - 語音對語音直接處理
          </p>
        </div>

        {/* Performance Comparison */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-center mb-4">效能對比</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold mb-2">傳統模式（REST API）</p>
              <ul className="space-y-1 text-gray-600">
                <li>• STT: 2-3 秒</li>
                <li>• Chat: 3-5 秒</li>
                <li>• TTS: 2-3 秒</li>
                <li className="font-bold text-red-600">總計: 10-15 秒</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-semibold mb-2">Realtime 模式</p>
              <ul className="space-y-1 text-gray-600">
                <li>• 語音對語音</li>
                <li>• 即時處理</li>
                <li>• 無中間轉換</li>
                <li className="font-bold text-green-600">總計: &lt; 1 秒</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
