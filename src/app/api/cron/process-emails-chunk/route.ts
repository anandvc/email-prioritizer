import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { LLMService } from '@/lib/llm-service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const MAX_PROCESSING_TIME = 45000; // 45 seconds

  try {
    // Verify the request is from Vercel cron or has the correct secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get chunk parameters from query string
    const url = new URL(request.url);
    const chunkSize = parseInt(url.searchParams.get('chunk') || '10');
    const minutesBack = parseInt(url.searchParams.get('minutes') || '16');
    const hoursBack = minutesBack / 60; // Convert to hours for the email service

    console.log(`Starting chunked email processing (chunk size: ${chunkSize}, minutes back: ${minutesBack})...`);

    // Check required environment variables
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

    // Initialize services
    const emailService = new EmailService();
    const llmService = new LLMService();

    const result = {
      totalEmails: 0,
      processedEmails: 0,
      needsReplyCount: 0,
      businessCount: 0,
      errors: [] as string[],
      timeoutReached: false
    };

    try {
      // Fetch recent emails
      console.log('Fetching recent emails...');
      const emails = await emailService.getRecentEmails(hoursBack);
      result.totalEmails = emails.length;

      if (emails.length === 0) {
        console.log('No new emails to process');
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          duration: `${(Date.now() - startTime) / 1000}s`,
          result
        });
      }

      console.log(`Found ${emails.length} emails to process in chunks of ${chunkSize}`);

      // Process only the first chunk to stay within time limits
      const chunk = emails.slice(0, chunkSize);
      console.log(`Processing chunk of ${chunk.length} emails...`);

      for (let i = 0; i < chunk.length; i++) {
        // Check timeout before each email
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_PROCESSING_TIME) {
          console.log(`⏰ Approaching timeout limit (${elapsed}ms). Stopping processing.`);
          result.timeoutReached = true;
          break;
        }

        const email = chunk[i];
        try {
          console.log(`Processing email ${i + 1}/${chunk.length}: "${email.subject}" from ${email.from}`);

          // Classify the email using LLM
          const classification = await llmService.classifyEmail(email);

          // Organize emails into folders based on classification
          if (classification.needsReply || classification.isBusiness) {
            console.log(`📧 Email ${email.uid} needs organization: needsReply=${classification.needsReply}, isBusiness=${classification.isBusiness}`);
            try {
              await emailService.applyLabels(email.uid, classification);
              console.log(`✅ Successfully organized email ${email.uid} into folders`);
            } catch (organizationError) {
              console.warn(`❌ Failed to organize email ${email.uid} into folders:`, organizationError);
            }
          }

          // Update counters
          result.processedEmails++;
          if (classification.needsReply) {
            result.needsReplyCount++;
          }
          if (classification.isBusiness) {
            result.businessCount++;
          }

          console.log(`Email ${email.uid} processed successfully`);

        } catch (error) {
          const errorMsg = `Error processing email ${email.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }

        // Small delay between emails
        if (i < chunk.length - 1 && Date.now() - startTime < MAX_PROCESSING_TIME) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

    } finally {
      emailService.disconnect();
    }

    const duration = (Date.now() - startTime) / 1000;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      result: {
        ...result,
        remainingEmails: Math.max(0, result.totalEmails - result.processedEmails)
      }
    };

    console.log('Chunked email processing completed:', response);

    return NextResponse.json(response);

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('Chunked email processing failed:', errorMsg);

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

export async function POST(request: NextRequest) {
  return GET(request);
}