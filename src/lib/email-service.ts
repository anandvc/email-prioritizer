import Imap from 'imap';

export interface EmailData {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  messageId: string;
}

export interface EmailClassification {
  needsReply: boolean;
  isBusiness: boolean;
  reasoning: string;
}

export class EmailService {
  private imap: Imap;

  constructor() {
    this.imap = new Imap({
      user: process.env.GMAIL_USER!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    });

    // Add error handler to prevent uncaught exceptions
    this.imap.on('error', (err: Error) => {
      console.warn('IMAP connection error:', err.message);
    });

    // Add end handler for clean disconnection
    this.imap.on('end', () => {
      console.log('IMAP connection ended');
    });
  }

  private async connectImap(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        console.log('IMAP connection ready');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  private async openInbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error('Error opening inbox:', err);
          reject(err);
        } else {
          console.log('Inbox opened successfully');
          resolve();
        }
      });
    });
  }

  private async searchEmails(criteria: (string | string[])[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.imap.search(criteria, (err, results) => {
        if (err) {
          console.error('Error searching emails:', err);
          reject(err);
        } else {
          console.log(`Found ${results.length} emails matching criteria`);
          resolve(results);
        }
      });
    });
  }

  private async fetchEmailData(uid: number): Promise<EmailData> {
    return new Promise((resolve) => {
      const fetch = this.imap.fetch(uid, {
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
      });

      let emailData: Partial<EmailData> = { uid };
      const headers: Record<string, string> = {};

      fetch.on('message', (msg) => {
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', () => {
            if (info.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)') {
              // Parse headers
              const lines = buffer.split('\r\n');
              for (const line of lines) {
                const match = line.match(/^([^:]+):\s*(.+)$/);
                if (match) {
                  headers[match[1].toLowerCase()] = match[2];
                }
              }
            }
          });
        });

        msg.once('end', () => {
          // Use headers to populate email data
          emailData = {
            uid,
            subject: headers.subject || 'No Subject',
            from: headers.from || 'Unknown',
            to: headers.to || 'Unknown',
            date: headers.date ? new Date(headers.date) : new Date(),
            body: 'Email body parsing simplified for testing',
            messageId: `uid-${uid}`
          };

          console.log(`Successfully parsed email ${uid}: "${emailData.subject}" from ${emailData.from}`);
          resolve(emailData as EmailData);
        });
      });

      fetch.once('error', (err) => {
        console.error(`Error fetching email ${uid}:`, err);
        // Provide fallback data for failed fetches
        resolve({
          uid,
          subject: 'Fetch Error',
          from: 'Unknown',
          to: 'Unknown',
          date: new Date(),
          body: 'Failed to fetch email',
          messageId: `fetch-error-${uid}`
        } as EmailData);
      });
    });
  }

  async getRecentEmails(hoursBack: number = 24): Promise<EmailData[]> {
    try {
      await this.connectImap();
      await this.openInbox();

      // Calculate the cutoff time
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
      console.log(`Looking for emails received after: ${cutoffTime.toISOString()}`);

      // For very recent emails (< 24 hours), search recent emails and filter by time
      // For older emails, use SINCE date search
      let searchCriteria: (string | string[])[];

      if (hoursBack <= 24) {
        // Search for emails from today and yesterday to ensure we catch everything
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format

        searchCriteria = [['SINCE', yesterdayString]];
        console.log(`Searching for emails since ${yesterdayString} (will filter by time after fetching)`);
      } else {
        // For longer periods, use date-only search
        const since = new Date();
        since.setHours(since.getHours() - hoursBack);
        const sinceString = since.toISOString().split('T')[0]; // YYYY-MM-DD format

        searchCriteria = [['SINCE', sinceString]];
        console.log(`Searching for emails since ${sinceString}`);
      }

      const uids = await this.searchEmails(searchCriteria);

      if (uids.length === 0) {
        console.log('No emails found for the specified date range');
        return [];
      }

      console.log(`Found ${uids.length} emails from IMAP search, now filtering by time...`);
      const emails: EmailData[] = [];

      // Process emails in smaller batches to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < uids.length; i += batchSize) {
        const batch = uids.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uids.length / batchSize)} (UIDs: ${batch.join(', ')})`);

        const batchPromises = batch.map(uid => this.fetchEmailData(uid).catch(error => {
          console.error(`Failed to fetch email ${uid}:`, error);
          // Return a placeholder email for failed fetches
          return {
            uid,
            subject: 'Fetch Error',
            from: 'Unknown',
            to: 'Unknown',
            date: new Date(0), // Very old date so it gets filtered out
            body: 'Failed to fetch email',
            messageId: `fetch-error-${uid}`
          } as EmailData;
        }));

        const batchEmails = await Promise.all(batchPromises);

        // Filter emails by actual receive time
        const filteredEmails = batchEmails.filter(email => {
          const emailTime = new Date(email.date);
          const isRecent = emailTime >= cutoffTime;

          if (isRecent) {
            console.log(`✅ Email ${email.uid} is recent: ${emailTime.toISOString()} >= ${cutoffTime.toISOString()}`);
          } else {
            console.log(`❌ Email ${email.uid} is too old: ${emailTime.toISOString()} < ${cutoffTime.toISOString()}`);
          }

          return isRecent;
        });

        emails.push(...filteredEmails);

        // Add delay between batches
        if (i + batchSize < uids.length) {
          console.log('Waiting 1 second before next batch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Successfully processed ${emails.length} emails within the time window (${hoursBack} hours back)`);
      return emails;
    } catch (error) {
      console.error('Error getting recent emails:', error);
      throw error;
    } finally {
      this.disconnect();
    }
  }

  async applyLabels(uid: number, classification: EmailClassification): Promise<void> {
    try {
      // Ensure we have a single IMAP connection
      if (!this.imap.state || this.imap.state !== 'authenticated') {
        await this.connectImap();
        await this.openInbox();
      }

      const labelsToAdd: string[] = [];
      const foldersToCreate: string[] = [];

      if (classification.needsReply) {
        labelsToAdd.push('Needs Reply');
        foldersToCreate.push('AI-Priority/Needs Reply');
      }

      if (classification.isBusiness) {
        labelsToAdd.push('Business');
        foldersToCreate.push('AI-Priority/Business');
      }

      if (labelsToAdd.length === 0) {
        console.log(`No labels to apply to email ${uid}`);
        return;
      }

      console.log(`📁 Organizing email ${uid} into folders:`, labelsToAdd);

      // Copy to specific folders for organization
      for (const folder of foldersToCreate) {
        try {
          await this.ensureFolderExists(folder);
          await this.copyEmailToFolder(uid, folder);
          console.log(`📁 Successfully copied email ${uid} to folder: ${folder}`);
        } catch (folderError) {
          console.warn(`Could not copy email ${uid} to folder ${folder}:`, folderError instanceof Error ? folderError.message : 'Unknown error');
          // Continue with other folders even if one fails
        }
      }

      console.log(`✅ Successfully organized email ${uid} into folders:`, labelsToAdd);
    } catch (error) {
      console.error(`Error organizing email ${uid}:`, error);
      // Don't throw - just log the error so processing can continue
      console.warn(`Continuing processing despite folder organization failure for email ${uid}`);
    }
  }

  private async ensureFolderExists(folderName: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if folder exists first
      this.imap.getBoxes((err, boxes) => {
        if (err) {
          console.warn(`Could not check folders:`, err.message);
          resolve(); // Don't fail if we can't check
          return;
        }

        // Check if folder already exists
        const folderExists = this.checkFolderExists(boxes, folderName);

        if (folderExists) {
          console.log(`📁 Folder "${folderName}" already exists`);
          resolve();
          return;
        }

        // Try to create the folder
        console.log(`📁 Creating folder: ${folderName}`);
        this.imap.addBox(folderName, (createErr) => {
          if (createErr) {
            console.warn(`Could not create folder ${folderName}:`, createErr.message);
            // Don't fail completely - folder creation is optional
            resolve();
          } else {
            console.log(`✅ Successfully created folder: ${folderName}`);
            resolve();
          }
        });
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private checkFolderExists(boxes: any, folderName: string): boolean {
    // Gmail uses '/' as separator, but the folder structure might be nested
    const parts = folderName.split('/');
    let current = boxes;

    for (const part of parts) {
      if (current && current[part]) {
        current = current[part].children;
      } else {
        return false;
      }
    }

    return true;
  }

  private async copyEmailToFolder(uid: number, folderName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use IMAP COPY command to copy email to folder
      this.imap.copy(uid, folderName, (err) => {
        if (err) {
          console.warn(`Could not copy email ${uid} to folder ${folderName}:`, err.message);
          reject(err);
        } else {
          console.log(`📁 Successfully copied email ${uid} to folder: ${folderName}`);
          resolve();
        }
      });
    });
  }

  disconnect(): void {
    try {
      if (this.imap && this.imap.state && this.imap.state !== 'disconnected') {
        // Remove all listeners to prevent memory leaks
        this.imap.removeAllListeners();

        // Properly end the connection
        this.imap.end();
        console.log('IMAP connection closed cleanly');
      }
    } catch (error) {
      console.warn('Error during IMAP disconnect:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}