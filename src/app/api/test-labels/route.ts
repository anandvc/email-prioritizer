import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer test-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Starting label test...');
    const startTime = Date.now();

    // Create a mock email for testing
    const mockEmail = {
      uid: 999999,
      subject: 'Test Business Email - Please Reply',
      from: 'test@business.com',
      to: 'anand.chhatpar@gmail.com',
      date: new Date(),
      body: 'This is a test email that should be classified as both needing a reply and being business-related. Please respond with your availability for a partnership discussion.',
      messageId: 'test-999999'
    };

    console.log(`🔍 Processing mock email: "${mockEmail.subject}" from ${mockEmail.from}`);

    // Test the classification
    const llmService = new (await import('@/lib/llm-service')).LLMService();
    const classification = await llmService.classifyEmail(mockEmail);

    console.log('🤖 Classification result:', classification);

    // Test the labeling (this will use the updated method)
    if (classification.needsReply || classification.isBusiness) {
      console.log('🏷️ Testing label application...');
      const emailService = new (await import('@/lib/email-service')).EmailService();

      try {
        await emailService.applyLabels(mockEmail.uid, classification);
        console.log('✅ Label application test completed successfully');
      } catch (labelError) {
        console.error('❌ Label application failed:', labelError);
        return NextResponse.json({
          success: false,
          error: 'Label application failed',
          details: labelError instanceof Error ? labelError.message : 'Unknown error',
          classification
        }, { status: 500 });
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      testMode: true,
      mockEmail: {
        uid: mockEmail.uid,
        subject: mockEmail.subject,
        from: mockEmail.from
      },
      classification,
      message: 'Label test completed - check logs for IMAP keyword errors'
    });

  } catch (error) {
    console.error('❌ Label test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
