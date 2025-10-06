import OpenAI from 'openai';
import { EmailData, EmailClassification } from './email-service';

export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY!,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  async classifyEmail(email: EmailData): Promise<EmailClassification> {
    try {
      console.log(`Classifying email: ${email.subject} from ${email.from}`);

      const prompt = this.buildClassificationPrompt(email);

      const completion = await this.openai.chat.completions.create({
        model: "qwen/qwen3-next-80b-a3b-instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert email classifier. Analyze emails to determine if they need a reply and if they contain business opportunities. Respond with a JSON object only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 1024,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        console.error('LLM API Response:', JSON.stringify(completion, null, 2));
        throw new Error(`No response from LLM. Full response: ${JSON.stringify(completion)}`);
      }

      console.log(`LLM response for email ${email.uid}:`, response);

      // Parse the JSON response
      const classification = this.parseClassificationResponse(response);

      console.log(`Classification for email ${email.uid}:`, classification);
      return classification;

    } catch (error) {
      console.error(`Error classifying email ${email.uid}:`, error);
      // Return safe defaults on error
      return {
        needsReply: false,
        isBusiness: false,
        reasoning: `Error during classification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildClassificationPrompt(email: EmailData): string {
    // Safely handle potentially undefined or null values
    const safeFrom = email.from || 'Unknown';
    const safeSubject = email.subject || 'No Subject';
    const safeDate = email.date ? email.date.toISOString() : new Date().toISOString();
    const safeBody = email.body || 'No content available';

    return `
Analyze this email and determine:
1. Does this email require a reply? (needsReply: true/false)
2. Does this email contain business opportunities or money-making potential? (isBusiness: true/false)

Email Details:
- From: ${safeFrom}
- Subject: ${safeSubject}
- Date: ${safeDate}
- Body: ${safeBody.substring(0, 2000)}${safeBody.length > 2000 ? '...' : ''}

Classification Criteria:

NEEDS REPLY (true if any apply):
- Direct questions asking for information or clarification
- Requests for action, decisions, or approval
- Meeting invitations or scheduling requests
- Customer inquiries or support requests
- Personal messages from colleagues, friends, or family
- Complaints or issues that need addressing
- Follow-ups on pending matters
- Invitations that require RSVP
- Messages asking for feedback or opinions

NEEDS REPLY (false if):
- Newsletters, marketing emails, or promotional content
- Automated notifications (shipping, billing, system alerts)
- Informational updates that don't require action
- Spam or clearly irrelevant emails
- Mass communications or announcements
- Social media notifications
- Receipts or confirmations (unless there's an issue)

BUSINESS OPPORTUNITY (true if any apply):
- Job offers, freelance opportunities, or consulting requests
- Partnership proposals or collaboration invitations
- Investment opportunities or funding offers
- Sales leads or potential client inquiries
- Speaking engagements or conference invitations
- Business development opportunities
- Networking opportunities with potential value
- Requests for paid services or expertise
- Licensing or monetization opportunities
- Affiliate or revenue-sharing proposals

BUSINESS OPPORTUNITY (false if):
- Personal emails with no commercial value
- Routine business communications (internal updates, etc.)
- Spam or scam attempts
- Generic marketing without specific opportunities
- Social or entertainment-related content

Respond with ONLY a JSON object in this exact format:
{
  "needsReply": boolean,
  "isBusiness": boolean,
  "reasoning": "Brief explanation of your decision"
}`;
  }

  private parseClassificationResponse(response: string): EmailClassification {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        needsReply: Boolean(parsed.needsReply),
        isBusiness: Boolean(parsed.isBusiness),
        reasoning: String(parsed.reasoning || 'No reasoning provided')
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.error('Raw response:', response);

      // Fallback: try to extract boolean values from text
      const needsReply = response.toLowerCase().includes('needsreply": true') ||
                        response.toLowerCase().includes('needs reply') ||
                        response.toLowerCase().includes('require') ||
                        response.toLowerCase().includes('question');

      const isBusiness = response.toLowerCase().includes('isbusiness": true') ||
                        response.toLowerCase().includes('business') ||
                        response.toLowerCase().includes('opportunity') ||
                        response.toLowerCase().includes('money');

      return {
        needsReply,
        isBusiness,
        reasoning: `Fallback parsing due to JSON error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}