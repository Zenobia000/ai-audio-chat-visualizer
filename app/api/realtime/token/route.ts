import { NextResponse } from 'next/server';

/**
 * GET /api/realtime/token
 * Returns OpenAI API key for Realtime API WebSocket connection
 */
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: apiKey });
  } catch (error) {
    console.error('Error fetching Realtime API token:', error);
    return NextResponse.json(
      { error: 'Failed to get API token' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
