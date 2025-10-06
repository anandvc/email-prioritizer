# 📧 AI Email Prioritizer

An intelligent email prioritization system that automatically organizes your Gmail emails using AI classification. The system identifies emails that need replies and business opportunities, then organizes them into dedicated folders for better email management.

## ✨ Features

- **🤖 AI-Powered Classification**: Uses NVIDIA's LLM API to intelligently classify emails
- **📁 Automatic Organization**: Creates and organizes emails into `AI-Priority/Needs Reply` and `AI-Priority/Business` folders
- **⏰ Automated Processing**: Runs on a configurable schedule (every 15 minutes recommended)
- **🔒 Secure**: Uses Gmail app-specific passwords and secure API keys
- **⚡ Optimized Performance**: Processes only recent emails with timeout protection
- **📊 Detailed Logging**: Comprehensive logging for monitoring and debugging
- **🚀 Vercel Ready**: Designed for easy deployment on Vercel with cron jobs

## 🎯 Email Classification

### Needs Reply
Emails that require your attention and response:
- Direct questions or requests for information
- Meeting invitations requiring RSVP
- Customer inquiries or support requests
- Personal messages from contacts
- Action items or tasks assigned to you

### Business Opportunities
Emails with potential money-making opportunities:
- Job offers and recruitment messages
- Partnership and collaboration proposals
- Investment opportunities
- Sales leads and business inquiries
- Speaking engagement invitations
- Consulting requests
- Monetization opportunities

## 🛠️ Tech Stack

- **Frontend/Backend**: Next.js 15 with TypeScript
- **Email Processing**: IMAP integration with Gmail
- **AI Classification**: NVIDIA LLM API (Qwen-3-Next-80B-A3B-Instruct - 10x faster than previous model)
- **Deployment**: Vercel with cron jobs
- **Styling**: Tailwind CSS

## 📋 Prerequisites

Before setting up the system, you'll need:

1. **Gmail Account** with 2FA enabled
2. **NVIDIA Developer Account** for LLM API access
3. **Vercel Account** for deployment
4. **Node.js 18+** for local development

## 🚀 Setup Instructions

### 1. Gmail Configuration

#### Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

#### Generate App-Specific Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and your device
3. Copy the generated 16-character password
4. Save this password securely - you'll need it for `GMAIL_APP_PASSWORD`

### 2. NVIDIA API Setup

#### Get NVIDIA API Key
1. Visit [NVIDIA Developer Portal](https://developer.nvidia.com/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate an API key for LLM access
5. Save the API key - you'll need it for `NVIDIA_API_KEY`

### 3. Project Setup

#### Clone and Install
```bash
git clone <your-repo-url>
cd email-prioritizer
npm install
```

#### Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Gmail Configuration
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# NVIDIA API Configuration
NVIDIA_API_KEY=your-nvidia-api-key

# Cron Security (generate a random string)
CRON_SECRET=your-random-secret-string
```

#### Local Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Testing the Setup

#### Test Gmail Connection
```bash
curl http://localhost:3000/api/test-connection
```

#### Test Email Processing
```bash
curl -X GET "http://localhost:3000/api/cron/process-emails?minutes=60" \
  -H "Authorization: Bearer your-random-secret-string"
```

## 🌐 Deployment

### Vercel Deployment

#### 1. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### 2. Configure Environment Variables
```bash
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add NVIDIA_API_KEY
vercel env add CRON_SECRET
```

#### 3. Redeploy with Environment Variables
```bash
vercel --prod
```

#### 4. Disable Password Protection
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Security**
4. Disable **Password Protection**
5. Save changes

### Cron Job Setup

The system includes a built-in Vercel cron job configuration in `vercel.json` that runs daily at 9 AM UTC. However, for more frequent processing, we recommend using an external cron service.

#### Option 1: Val.town (Recommended)
1. Create account at [Val.town](https://val.town)
2. Create a new val with this code:

```javascript
export default async function emailProcessor() {
  const response = await fetch("https://your-vercel-app.vercel.app/api/cron/process-emails", {
    method: "GET",
    headers: {
      "Authorization": "Bearer your-cron-secret"
    }
  });

  const result = await response.json();
  console.log("Email processing result:", result);
  return result;
}
```

3. Set up cron schedule: `*/15 * * * *` (every 15 minutes)

#### Option 2: GitHub Actions
Create `.github/workflows/email-cron.yml`:

```yaml
name: Email Processing Cron
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  process-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Process Emails
        run: |
          curl -X GET "${{ secrets.VERCEL_URL }}/api/cron/process-emails" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 📊 API Endpoints

### Main Processing Endpoint
```
GET /api/cron/process-emails?minutes=16
Authorization: Bearer your-cron-secret
```

**Parameters:**
- `minutes` (optional): Lookback window in minutes (default: 16)

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "duration": "15.2s",
  "lookbackMinutes": 16,
  "result": {
    "totalEmails": 25,
    "processedEmails": 25,
    "needsReplyCount": 3,
    "businessCount": 2,
    "errorCount": 0,
    "timeoutReached": false,
    "remainingEmails": 0
  }
}
```

### Chunked Processing (For Large Volumes)
```
GET /api/cron/process-emails-chunk?chunk=10&minutes=16
Authorization: Bearer your-cron-secret
```

### Health Check
```
GET /api/health
```

### Connection Test
```
GET /api/test-connection
```

## ⚙️ Configuration

### Processing Window
- **Default**: 16 minutes (perfect for 15-minute cron jobs)
- **Configurable**: Use `?minutes=X` parameter
- **Overlap**: 1-minute buffer ensures no emails are missed

### Performance Limits
- **Timeout Protection**: 45-second processing limit
- **Batch Processing**: Processes emails in batches of 3-10
- **Rate Limiting**: Built-in delays to respect API limits

### Folder Structure
The system creates these Gmail folders automatically:
```
📁 AI-Priority/
  ├── 📁 Needs Reply/
  └── 📁 Business/
```

## 🔧 Customization

### Modifying Classification Criteria

Edit `src/lib/llm-service.ts` to customize the classification prompt:

```typescript
const prompt = `
Analyze this email and classify it based on your custom criteria:

Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Date: ${email.date}

// Add your custom classification logic here
`;
```

### Adding New Email Categories

1. Update the `EmailClassification` interface in `src/lib/email-service.ts`
2. Modify the classification logic in `src/lib/llm-service.ts`
3. Update folder creation in `src/lib/email-service.ts`

### Changing Processing Schedule

Update `vercel.json` for different Vercel cron schedules:

```json
{
  "crons": [{
    "path": "/api/cron/process-emails",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

## 🐛 Troubleshooting

### Common Issues

#### Gmail Connection Errors
- Verify 2FA is enabled on your Google account
- Ensure app-specific password is correct (16 characters, no spaces)
- Check that IMAP is enabled in Gmail settings

#### NVIDIA API Errors
- Verify your API key is valid and active
- Check your API usage limits
- Ensure you have access to the Llama model

#### Vercel Timeout Issues
- Reduce the processing window (`?minutes=5`)
- Use the chunked endpoint for large email volumes
- Check Vercel function logs for specific errors

#### No Emails Found
- Verify the time window is appropriate
- Check Gmail folder permissions
- Ensure emails exist in the specified timeframe

### Debug Mode

Enable detailed logging by checking Vercel function logs:
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Functions** tab
4. Click on recent invocations to see logs

## 📈 Monitoring

### Key Metrics to Monitor
- **Processing Time**: Should be under 45 seconds
- **Email Volume**: Typical range 5-50 emails per 15-minute window
- **Classification Accuracy**: Monitor false positives/negatives
- **Error Rate**: Should be near 0%

### Logging
The system provides comprehensive logging:
- Email fetching and filtering
- AI classification results
- Folder organization status
- Performance metrics
- Error details

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include comprehensive logging
- Test with various email types
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NVIDIA** for providing the LLM API
- **Vercel** for hosting and cron job infrastructure
- **Gmail IMAP** for email access
- **Next.js** for the application framework

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Vercel function logs
3. Open an issue on GitHub
4. Join our community discussions

---

**Happy Email Organizing!** 📧✨

Made with ❤️ for better email management
