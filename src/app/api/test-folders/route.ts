import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Starting folder organization test...');
    const startTime = Date.now();

    // Create a mock email for testing
    const mockEmail = {
      uid: 888888,
      subject: 'URGENT: Partnership Proposal - Please Respond ASAP',
      from: 'business@opportunity.com',
      to: 'anand.chhatpar@gmail.com',
      date: new Date(),
      body: 'We have an exciting business partnership opportunity. Please respond with your availability for a call this week to discuss potential collaboration and revenue sharing.',
      messageId: 'test-888888'
    };

    console.log(`🔍 Testing folder organization for: "${mockEmail.subject}" from ${mockEmail.from}`);

    // Test the classification
    const llmService = new (await import('@/lib/llm-service')).LLMService();
    const classification = await llmService.classifyEmail(mockEmail);

    console.log('🤖 Classification result:', classification);

    // Test the enhanced labeling with folder organization
    if (classification.needsReply || classification.isBusiness) {
      console.log('🏷️ Testing enhanced label application with folder organization...');
      const emailService = new (await import('@/lib/email-service')).EmailService();

      try {
        await emailService.applyLabels(mockEmail.uid, classification);
        console.log('✅ Enhanced label application with folders completed successfully');
      } catch (labelError) {
        console.error('❌ Enhanced label application failed:', labelError);
        return NextResponse.json({
          success: false,
          error: 'Enhanced label application failed',
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
      expectedFolders: [
        classification.needsReply ? 'AI-Priority/Needs Reply' : null,
        classification.isBusiness ? 'AI-Priority/Business' : null
      ].filter(Boolean),
      message: 'Check logs for folder creation and email copying results'
    });

  } catch (error) {
    console.error('❌ Folder organization test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}