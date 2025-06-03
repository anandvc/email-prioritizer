# Contributing to AI Email Prioritizer

Thank you for your interest in contributing to the AI Email Prioritizer! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Gmail account with 2FA enabled
- NVIDIA Developer account

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/email-prioritizer.git
   cd email-prioritizer
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with:
   ```env
   GMAIL_USER=your.email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   NVIDIA_API_KEY=your-nvidia-api-key
   CRON_SECRET=your-random-secret
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting (Prettier/ESLint)
- Add proper type definitions
- Include JSDoc comments for public functions

### Testing
- Test your changes locally before submitting
- Verify Gmail connection works
- Test email processing with various email types
- Check that classification logic works correctly

### Commit Messages
Use conventional commit format:
```
feat: add support for custom email categories
fix: resolve IMAP timeout issues
docs: update setup instructions
refactor: optimize email fetching performance
```

## 📝 Types of Contributions

### 🐛 Bug Reports
When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS)
- Relevant logs or error messages

### ✨ Feature Requests
For new features, please:
- Describe the use case
- Explain the expected behavior
- Consider backward compatibility
- Discuss implementation approach

### 🔧 Code Contributions

#### Areas for Contribution
- **Email Classification**: Improve AI prompts and logic
- **Performance**: Optimize email processing speed
- **Error Handling**: Better error recovery and reporting
- **Documentation**: Improve setup guides and examples
- **Testing**: Add automated tests
- **UI/UX**: Enhance the web interface
- **Integrations**: Support for other email providers

#### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Update documentation if needed
4. Test thoroughly
5. Submit a pull request with:
   - Clear title and description
   - Reference any related issues
   - Screenshots for UI changes
   - Testing instructions

## 🏗️ Architecture Overview

### Key Components
- **Email Service** (`src/lib/email-service.ts`): IMAP connection and Gmail operations
- **LLM Service** (`src/lib/llm-service.ts`): AI classification using NVIDIA API
- **Email Processor** (`src/lib/email-processor.ts`): Main orchestration logic
- **API Routes** (`src/app/api/`): REST endpoints for processing and testing

### Data Flow
```
Gmail IMAP → Email Service → Email Processor → LLM Service → Gmail Folders
```

## 🧪 Testing Guidelines

### Manual Testing
1. **Connection Test**
   ```bash
   curl http://localhost:3000/api/test-connection
   ```

2. **Email Processing**
   ```bash
   curl -X GET "http://localhost:3000/api/cron/process-emails?minutes=60" \
     -H "Authorization: Bearer your-secret"
   ```

3. **Verify Gmail Folders**
   Check that `AI-Priority/Needs Reply` and `AI-Priority/Business` folders are created

### Test Cases to Consider
- Various email types (newsletters, personal, business)
- Different time windows (1 minute to 24 hours)
- Large email volumes (100+ emails)
- Network connectivity issues
- API rate limiting scenarios

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Include parameter and return type descriptions
- Provide usage examples for complex functions

### README Updates
- Update setup instructions for new features
- Add new configuration options
- Include troubleshooting for new issues

## 🔒 Security Considerations

### Sensitive Data
- Never commit API keys or passwords
- Use environment variables for all secrets
- Sanitize logs to avoid exposing sensitive information

### Email Privacy
- Don't store email content permanently
- Minimize data sent to external APIs
- Respect user privacy in all implementations

## 🚀 Deployment Testing

Before submitting PRs that affect deployment:
1. Test on Vercel staging environment
2. Verify environment variable handling
3. Check cron job functionality
4. Monitor performance metrics

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific discussions

### Response Times
- We aim to respond to issues within 48 hours
- Pull requests are typically reviewed within a week
- Complex changes may require additional discussion

## 🎯 Roadmap

### Upcoming Features
- Support for Outlook/Exchange
- Custom classification categories
- Email analytics dashboard
- Mobile app integration
- Advanced filtering rules

### Long-term Goals
- Multi-language support
- Enterprise features
- Plugin architecture
- Machine learning improvements

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to join the core contributor team (for significant contributions)

---

Thank you for helping make email management better for everyone! 🚀