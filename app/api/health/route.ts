import { NextRequest, NextResponse } from 'next/server';
import { checkOpenAIConnection } from '@/lib/openai/client';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const openaiHealthy = await checkOpenAIConnection();

    const health = {
      status: openaiHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      services: {
        openai: openaiHealthy,
      },
    };

    return NextResponse.json(health, {
      status: openaiHealthy ? 200 : 503,
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

export const runtime = 'edge';
export const maxDuration = 10;
