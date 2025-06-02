# Email Prioritization Service

An intelligent email prioritization system that automatically categorizes your Gmail emails using AI to help you focus on what matters most. Built with Next.js and deployed on Vercel.

## Features

- **🔍 Smart Classification**: AI-powered email analysis using NVIDIA's Llama model
- **📧 Gmail Integration**: Direct IMAP connection to your Gmail account
- **🏷️ Automatic Labeling**: Applies Gmail labels directly to your emails
- **⚡ Automated Processing**: Daily cron job processes emails automatically
- **🔒 Secure**: Uses app-specific passwords and secure API connections

## Email Categories

The system automatically applies two types of labels:

### "Needs Reply"
Applied to emails that require your response:
- Direct questions asking for information
- Requests for action, decisions, or approval
- Meeting invitations or scheduling requests
- Customer inquiries or support requests
- Personal messages from colleagues, friends, or family
- Complaints or issues that need addressing

### "Business"
Applied to emails with money-making potential:
- Job offers, freelance opportunities, or consulting requests
- Partnership proposals or collaboration invitations
- Investment opportunities or funding offers
- Sales leads or potential client inquiries
- Speaking engagements or conference invitations
- Business development opportunities

## Setup Instructions

### 1. Clone and Deploy

```bash
git clone <your-repo-url>
cd email-prioritizer
npm install
```

Deploy to Vercel:
```bash
npx vercel --prod
```

### 2. Environment Variables

Set up the following environment variables in your Vercel dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `GMAIL_USER` | Your Gmail email address | ✅ |
| `GMAIL_APP_PASSWORD` | Gmail app-specific password | ✅ |
| `NVIDIA_API_KEY` | NVIDIA AI Foundation Models API key | ✅ |
| `CRON_SECRET` | Random secret string for cron security | ✅ |

### 3. Gmail App Password Setup

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Generate a new app password for "Mail"
5. Use this password as your `GMAIL_APP_PASSWORD`

### 4. NVIDIA API Key

1. Visit [NVIDIA AI Foundation Models](https://build.nvidia.com/)
2. Sign up/login and navigate to the API section
3. Generate an API key
4. Use this key as your `NVIDIA_API_KEY`

## Usage

### Automatic Processing

The system runs automatically every day at 9:00 AM UTC via Vercel cron jobs. It will:

1. Connect to your Gmail via IMAP
2. Fetch emails from the last 24 hours
3. Analyze each email using AI
4. Apply appropriate labels to your Gmail

### Manual Testing

You can test the system manually using these API endpoints:

#### Test Connection
```bash
curl https://your-app.vercel.app/api/test-connection
```

#### Manual Email Processing
```bash
curl -X POST https://your-app.vercel.app/api/cron/process-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## API Endpoints

### `GET /api/test-connection`
Tests your Gmail connection and configuration.

**Response:**
```json
{
  "success": true,
  "message": "Email connection test successful",
  "timestamp": "2024-01-01T09:00:00.000Z",
  "config": {
    "gmailUser": "your-email@gmail.com",
    "hasAppPassword": true,
    "hasNvidiaKey": true
  }
}
```

### `GET/POST /api/cron/process-emails`
Processes recent emails and applies labels.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T09:00:00.000Z",
  "duration": "45.2s",
  "result": {
    "totalEmails": 25,
    "processedEmails": 25,
    "needsReplyCount": 8,
    "businessCount": 3,
    "errorCount": 0
  }
}
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel Cron   │───▶│   Next.js API    │───▶│  Email Service  │
│   (Daily 9AM)   │    │     Routes       │    │   (IMAP/Gmail)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   LLM Service    │───▶│  NVIDIA Llama   │
                       │  (Classification)│    │      API        │
                       └──────────────────┘    └─────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cron/process-emails/route.ts    # Cron job endpoint
│   │   └── test-connection/route.ts        # Connection test endpoint
│   ├── page.tsx                            # Main landing page
│   └── layout.tsx                          # App layout
├── lib/
│   ├── email-service.ts                    # Gmail IMAP service
│   ├── llm-service.ts                      # NVIDIA LLM integration
│   └── email-processor.ts                 # Main orchestration logic
vercel.json                                 # Vercel cron configuration
```

## Monitoring and Logs

- View logs in the Vercel dashboard under your project's "Functions" tab
- The system provides detailed logging for debugging
- Check the cron job execution history in Vercel's cron section

## Troubleshooting

### Common Issues

1. **IMAP Connection Failed**
   - Verify your Gmail app password is correct
   - Ensure 2FA is enabled on your Google account
   - Check that IMAP is enabled in Gmail settings

2. **LLM API Errors**
   - Verify your NVIDIA API key is valid
   - Check API rate limits and quotas
   - Ensure you have access to the Llama model

3. **No Emails Processed**
   - Check if you have new emails in the specified timeframe
   - Verify the email search criteria in logs
   - Ensure emails aren't already processed (marked as seen)

### Debug Mode

For detailed debugging, check the Vercel function logs after running:
```bash
curl -X POST https://your-app.vercel.app/api/cron/process-emails
```

## Security Considerations

- Uses Gmail app-specific passwords (not your main password)
- API endpoints are protected with secret tokens
- No email content is stored permanently
- All connections use TLS encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Vercel function logs
3. Test individual components using the API endpoints
4. Open an issue with detailed error logs
