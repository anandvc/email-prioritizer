import { NextRequest, NextResponse } from 'next/server';
import { EmailProcessor } from '@/lib/email-processor';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify the request is from Vercel cron or has the correct secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Only require auth if CRON_SECRET is set (for production)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled email processing...');

    // Check if all required environment variables are set
    const requiredEnvVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'NVIDIA_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error(errorMsg);
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }

    // Initialize the email processor
    const processor = new EmailProcessor();

    // Process emails from the last 24 hours
    const result = await processor.processRecentEmails(24);

    const duration = (Date.now() - startTime) / 1000;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      result: {
        totalEmails: result.totalEmails,
        processedEmails: result.processedEmails,
        needsReplyCount: result.needsReplyCount,
        businessCount: result.businessCount,
        errorCount: result.errors.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined
    };

    console.log('Email processing completed successfully:', response);

    return NextResponse.json(response);

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('Email processing failed:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        duration: `${duration}s`,
        error: errorMsg
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}