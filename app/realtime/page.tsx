'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRealtimeAPI } from '@/src/main/typescript/hooks/useRealtimeAPI';

export default function RealtimePage() {
  const { state, connect, disconnect, startRecording, stopRecording } = useRealtimeAPI({
    voice: 'alloy',
    temperature: 0.8,
  });

  const isRecordingRef = useRef(false);

  useEffect(() => {
    // Auto-connect on mount
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard support - Space bar to record
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Space key, not already recording, and element not in input/textarea
      if (
        e.code === 'Space' &&
        !isRecordingRef.current &&
        state.isConnected &&
        !state.isAISpeaking &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        isRecordingRef.current = true;
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecordingRef.current) {
        e.preventDefault();
        isRecordingRef.current = false;
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isConnected, state.isAISpeaking, startRecording, stopRecording]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI 語音對話
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            按住按鈕說話，AI 即時回應
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center">
          {state.isConnected ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>已連接</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>連接中...</span>
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
              w-40 h-40 rounded-full text-white font-bold text-lg shadow-2xl
              transition-all duration-200 transform
              ${state.isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110 shadow-red-200'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 hover:shadow-indigo-200'
              }
              ${!state.isConnected || state.isAISpeaking
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-xl active:scale-95'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">
                {state.isRecording ? '🎤' : state.isAISpeaking ? '🔊' : '🎤'}
              </span>
              <span className="text-sm">
                {state.isRecording ? '錄音中' : state.isAISpeaking ? 'AI 回應中' : '按住說話'}
              </span>
            </div>
          </button>

          {/* Status Text */}
          {state.isRecording && (
            <p className="text-sm text-gray-600 animate-pulse">
              放開按鈕後 AI 會開始處理...
            </p>
          )}
          {state.isAISpeaking && (
            <p className="text-sm text-gray-600 animate-pulse">
              AI 正在回應中...
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">連接錯誤</p>
              <p className="text-red-600 text-sm mt-1">{state.error}</p>
            </div>
          )}

          {state.transcript && (
            <div className="p-4 bg-white border border-indigo-200 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 mb-1">你說：</p>
              <p className="text-gray-800">{state.transcript}</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="p-4 bg-white/80 backdrop-blur rounded-xl border border-gray-200 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">使用說明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 按住麥克風按鈕或按住 <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs font-mono">空格鍵</kbd> 開始說話</li>
            <li>• 放開按鈕/鍵盤後 AI 會自動處理並回應</li>
            <li>• 支援繁體中文對話</li>
          </ul>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            ← 返回首頁
          </Link>
        </div>

        {/* Tech Note */}
        <p className="text-center text-xs text-gray-400">
          Powered by OpenAI Realtime API
        </p>
      </div>
    </main>
  );
}
