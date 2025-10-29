import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/connection';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();

    const healthData = {
      status: dbHealth.status === 'healthy'? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'AksabCare NG API',
      version: '1.0.0',
      database: dbHealth,
      uptime: process.uptime(),
    };

    const statusCode = dbHealth.status === 'healthy'? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    let errorMessage = 'An unknown error occurred.';

    // Use a type guard to safely access the error message
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}