import { NextResponse } from 'next/server';
import { EmailProcessor } from '@/lib/email-processor';

export async function GET() {
  try {
    console.log('Testing email connection...');

    // Check if all required environment variables are set
    const requiredEnvVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'NVIDIA_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Test the email connection
    const processor = new EmailProcessor();
    const connectionSuccess = await processor.testConnection();

    if (connectionSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Email connection test successful',
        timestamp: new Date().toISOString(),
        config: {
          gmailUser: process.env.GMAIL_USER,
          hasAppPassword: !!process.env.GMAIL_APP_PASSWORD,
          hasNvidiaKey: !!process.env.NVIDIA_API_KEY
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Email connection test failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Connection test error:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}