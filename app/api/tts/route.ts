import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { logRequest, logError } from '@/lib/utils/logger';

/**
 * POST /api/tts
 * Text-to-Speech endpoint using OpenAI TTS API
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logRequest('/api/tts');

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Call TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Natural sounding voice
      input: text,
      speed: 1.0,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const duration = Date.now() - startTime;

    // Return audio as MP3
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'X-Duration': duration.toString(),
      },
    });

  } catch (error) {
    logError('/api/tts', error);
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 30;
