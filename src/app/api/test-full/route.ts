import { NextResponse } from 'next/server';
import { EmailProcessor } from '@/lib/email-processor';

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🧪 Starting full email processing test...');

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

    // Process emails from the last 2 hours (smaller test)
    console.log('Processing emails from last 2 hours...');
    const result = await processor.processRecentEmails(2);

    const duration = (Date.now() - startTime) / 1000;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      testMode: true,
      timeRange: 'last 2 hours',
      result: {
        totalEmails: result.totalEmails,
        processedEmails: result.processedEmails,
        needsReplyCount: result.needsReplyCount,
        businessCount: result.businessCount,
        errorCount: result.errors.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      message: 'Check server logs for any IMAP keyword errors - they should be gone!'
    };

    console.log('✅ Full email processing test completed:', response);

    return NextResponse.json(response);

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Full email processing test failed:', errorMsg);

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