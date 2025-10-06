import { EmailService, EmailData } from './email-service';
import { LLMService } from './llm-service';

export interface ProcessingResult {
  totalEmails: number;
  processedEmails: number;
  needsReplyCount: number;
  businessCount: number;
  errors: string[];
  timeoutReached?: boolean;
  remainingEmails?: number;
}

export class EmailProcessor {
  private emailService: EmailService;
  private llmService: LLMService;
  private readonly MAX_PROCESSING_TIME = 45000; // 45 seconds (leave 15s buffer for Vercel's 60s limit)

  constructor() {
    this.emailService = new EmailService();
    this.llmService = new LLMService();
  }

  async processRecentEmails(hoursBack: number = 24): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`Starting email processing for last ${hoursBack} hours...`);

    const result: ProcessingResult = {
      totalEmails: 0,
      processedEmails: 0,
      needsReplyCount: 0,
      businessCount: 0,
      errors: []
    };

    try {
      // Fetch recent emails
      console.log('Fetching recent emails...');
      const emails = await this.emailService.getRecentEmails(hoursBack);
      result.totalEmails = emails.length;

      if (emails.length === 0) {
        console.log('No new emails to process');
        return result;
      }

      console.log(`Found ${emails.length} emails to process`);

      // Process emails sequentially to respect NVIDIA API rate limit (1 request per 2 seconds)
      for (let i = 0; i < emails.length; i++) {
        // Check if we're approaching timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > this.MAX_PROCESSING_TIME) {
          console.log(`⏰ Approaching timeout limit (${elapsed}ms). Stopping processing.`);
          result.timeoutReached = true;
          result.remainingEmails = emails.length - i;
          break;
        }

        const email = emails[i];
        console.log(`Processing email ${i + 1}/${emails.length} (${elapsed}ms elapsed)`);

        try {
          await this.processEmail(email, result);
        } catch (error) {
          const errorMsg = `Error processing email ${email.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }

        // Wait 2 seconds between API calls to respect NVIDIA rate limit (except for last email)
        if (i < emails.length - 1 && Date.now() - startTime < this.MAX_PROCESSING_TIME) {
          console.log('Waiting 2 seconds before next email (NVIDIA rate limit)...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Email processing completed in ${duration}s`);
      console.log(`Results: ${result.processedEmails}/${result.totalEmails} processed, ${result.needsReplyCount} need reply, ${result.businessCount} business opportunities`);

      if (result.timeoutReached) {
        console.log(`⚠️ Processing stopped due to timeout. ${result.remainingEmails} emails remaining.`);
      }

      if (result.errors.length > 0) {
        console.log(`Errors encountered: ${result.errors.length}`);
        result.errors.forEach(error => console.error(`- ${error}`));
      }

      return result;

    } catch (error) {
      const errorMsg = `Fatal error during email processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
      return result;
    } finally {
      // Ensure IMAP connection is closed
      this.emailService.disconnect();
    }
  }

  private async processEmail(email: EmailData, result: ProcessingResult): Promise<void> {
    try {
      console.log(`Processing email ${email.uid}: "${email.subject}" from ${email.from}`);

      // Classify the email using LLM
      const classification = await this.llmService.classifyEmail(email);

      // Organize emails into folders based on classification
      if (classification.needsReply || classification.isBusiness) {
        console.log(`📧 Email ${email.uid} needs organization: needsReply=${classification.needsReply}, isBusiness=${classification.isBusiness}`);
        try {
          await this.emailService.applyLabels(email.uid, classification);
          console.log(`✅ Successfully organized email ${email.uid} into folders`);
        } catch (organizationError) {
          console.warn(`❌ Failed to organize email ${email.uid} into folders:`, organizationError);
          // Don't fail the entire process for organization issues
        }
      } else {
        console.log(`📧 Email ${email.uid} does not need organization (needsReply=${classification.needsReply}, isBusiness=${classification.isBusiness})`);
      }

      // Update counters
      result.processedEmails++;
      if (classification.needsReply) {
        result.needsReplyCount++;
      }
      if (classification.isBusiness) {
        result.businessCount++;
      }

      console.log(`Email ${email.uid} processed successfully:`, {
        needsReply: classification.needsReply,
        isBusiness: classification.isBusiness,
        reasoning: classification.reasoning
      });

    } catch (error) {
      throw new Error(`Failed to process email ${email.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing email service connection...');
      const emails = await this.emailService.getRecentEmails(1);
      console.log(`Connection test successful. Found ${emails.length} emails from last hour.`);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}