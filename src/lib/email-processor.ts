import { EmailService, EmailData } from './email-service';
import { LLMService } from './llm-service';

export interface ProcessingResult {
  totalEmails: number;
  processedEmails: number;
  needsReplyCount: number;
  businessCount: number;
  errors: string[];
}

export class EmailProcessor {
  private emailService: EmailService;
  private llmService: LLMService;

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

      // Process emails in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`);

        await Promise.all(
          batch.map(async (email) => {
            try {
              await this.processEmail(email, result);
            } catch (error) {
              const errorMsg = `Error processing email ${email.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              console.error(errorMsg);
              result.errors.push(errorMsg);
            }
          })
        );

        // Add delay between batches to be respectful to APIs
        if (i + batchSize < emails.length) {
          console.log('Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Email processing completed in ${duration}s`);
      console.log(`Results: ${result.processedEmails}/${result.totalEmails} processed, ${result.needsReplyCount} need reply, ${result.businessCount} business opportunities`);

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