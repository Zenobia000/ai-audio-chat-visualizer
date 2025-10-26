'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const volumeSamplesRef = useRef<number[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      setVolumeLevel(0);
      volumeSamplesRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Audio Context for volume analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start volume monitoring
      monitorVolume();

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
        // Stop volume monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Calculate recording duration
        const recordingDuration = Date.now() - recordingStartTimeRef.current;

        // Validate recording (minimum 0.5 seconds)
        if (recordingDuration < 500) {
          setError('錄音時間太短，請按住至少 0.5 秒後再說話');
          stream.getTracks().forEach(track => track.stop());
          setVolumeLevel(0);
          return;
        }

        // Check average volume (threshold: 0.01)
        const avgVolume = volumeSamplesRef.current.reduce((a, b) => a + b, 0) / volumeSamplesRef.current.length;
        if (avgVolume < 0.01) {
          setError('未偵測到語音，請提高音量或靠近麥克風說話');
          stream.getTracks().forEach(track => track.stop());
          setVolumeLevel(0);
          return;
        }

        if (audioBlob.size < 5000) {
          setError('音訊資料不足，請確認麥克風正常運作');
          stream.getTracks().forEach(track => track.stop());
          setVolumeLevel(0);
          return;
        }

        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setVolumeLevel(0);
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('無法啟動麥克風，請確認權限設定');
    }
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255;

      setVolumeLevel(rms);
      volumeSamplesRef.current.push(rms);

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Keyboard shortcut for recording (Space key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent recording if already processing or recording
      if (isProcessing || isRecording) return;

      // Use Space key to start recording
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isProcessing]);

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
            MVP v1.0 - 語音對話原型（傳統模式）
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              ⚡ 新功能：極速語音對話模式已推出！
            </p>
            <a
              href="/realtime"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🚀 切換到 Realtime 模式 (延遲 &lt; 1 秒)
            </a>
          </div>
        </div>

        {/* Microphone Button */}
        <div className="flex flex-col items-center gap-4">
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

          {/* Volume Indicator */}
          {isRecording && (
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>音量</span>
                <span>{(volumeLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    volumeLevel > 0.01 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500">
                {volumeLevel < 0.01 ? '⚠️ 音量過低，請提高音量' : '✅ 音量正常'}
              </p>
            </div>
          )}
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
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>💡 按住麥克風按鈕說話，放開後等待 AI 回應</p>
          <p>⌨️ 快捷鍵：按住 <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-mono">空白鍵</kbd> 開始錄音</p>
          <p>🎤 即時音量指示器會顯示您的說話音量</p>
          <p className="mt-2">🎯 目標：驗證語音對話核心流程</p>
        </div>
      </div>
    </main>
  );
}
