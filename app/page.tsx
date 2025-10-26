'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('無法啟動麥克風，請確認權限設定');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscript('');
    setAiResponse('');

    try {
      // Step 1: Speech to Text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error('STT failed');
      }

      const { transcription } = await sttResponse.json();
      setTranscript(transcription);

      // Step 2: Chat Completion
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcription }),
      });

      if (!chatResponse.ok) {
        throw new Error('Chat failed');
      }

      const { response } = await chatResponse.json();
      setAiResponse(response);

      // Step 3: Text to Speech
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: response }),
      });

      if (!ttsResponse.ok) {
        throw new Error('TTS failed');
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audio = new Audio(URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/mpeg' })));
      await audio.play();

    } catch (err) {
      console.error('Processing error:', err);
      setError('處理失敗，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            AI Audio Chat Visualizer
          </h1>
          <p className="text-gray-600">
            MVP v1.0 - 語音對話原型
          </p>
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
            className={`
              w-32 h-32 rounded-full text-white font-bold text-lg
              transition-all duration-200 transform
              ${isRecording
                ? 'bg-red-500 scale-110 animate-pulse'
                : 'bg-blue-500 hover:scale-105'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}
            `}
          >
            {isRecording ? '🎤 錄音中' : isProcessing ? '⏳ 處理中' : '🎤 按住說話'}
          </button>
        </div>

        {/* Status & Messages */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {transcript && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">你說：</p>
              <p className="text-gray-900">{transcript}</p>
            </div>
          )}

          {aiResponse && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">AI 回應：</p>
              <p className="text-gray-900">{aiResponse}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500">
          <p>💡 按住麥克風按鈕說話，放開後等待 AI 回應</p>
          <p className="mt-2">🎯 目標：驗證語音對話核心流程</p>
        </div>
      </div>
    </main>
  );
}
