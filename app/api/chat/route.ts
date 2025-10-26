import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { logRequest, logError } from '@/lib/utils/logger';

/**
 * POST /api/chat
 * Chat completion endpoint using GPT-4o-mini
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logRequest('/api/chat');

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Call GPT API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一個友善且樂於助人的 AI 助手。請用簡潔、自然的繁體中文回應。',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - startTime;

    return NextResponse.json({
      response,
      duration,
    });

  } catch (error) {
    logError('/api/chat', error);
    return NextResponse.json(
      { error: 'Chat completion failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 30;
