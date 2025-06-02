import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Email Prioritizer',
    version: '1.0.0',
    message: 'Service is running successfully on Vercel!'
  });
}