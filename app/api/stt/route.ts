import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { logRequest, logError } from '@/lib/utils/logger';

/**
 * POST /api/stt
 * Speech-to-Text endpoint using OpenAI Whisper API
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logRequest('/api/stt');

    // Extract audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'zh', // Chinese language hint
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      transcription: transcription.text,
      duration,
    });

  } catch (error) {
    logError('/api/stt', error);
    return NextResponse.json(
      { error: 'STT processing failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 30;
