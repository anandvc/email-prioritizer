import { NextResponse } from 'next/server';
import { EmailProcessor } from '@/lib/email-processor';

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🧪 Starting real email folder organization test...');

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

    // Process emails from the last 30 minutes (very small test)
    console.log('Processing emails from last 30 minutes with folder organization...');
    const result = await processor.processRecentEmails(0.5);

    const duration = (Date.now() - startTime) / 1000;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      testMode: true,
      timeRange: 'last 30 minutes',
      result: {
        totalEmails: result.totalEmails,
        processedEmails: result.processedEmails,
        needsReplyCount: result.needsReplyCount,
        businessCount: result.businessCount,
        errorCount: result.errors.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      expectedFolders: [
        'AI-Priority/Needs Reply',
        'AI-Priority/Business'
      ],
      message: 'Check Gmail for new AI-Priority folders and organized emails!'
    };

    console.log('✅ Real email folder organization test completed:', response);

    return NextResponse.json(response);

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Real email folder organization test failed:', errorMsg);

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