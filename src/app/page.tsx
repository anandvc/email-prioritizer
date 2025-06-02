export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Email Prioritization Service
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Automatically categorize your Gmail emails using AI to help you focus on what matters most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🔍 Smart Classification
            </h2>
            <p className="text-gray-600 mb-4">
              Our AI analyzes your emails and automatically applies labels:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Needs Reply:</strong> Emails requiring your response</li>
              <li><strong>Business:</strong> Opportunities that could help you make money</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ⚡ Automated Processing
            </h2>
            <p className="text-gray-600 mb-4">
              The service runs automatically every day at 9 AM UTC, processing:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Emails from the last 24 hours</li>
              <li>Applies Gmail labels directly</li>
              <li>Handles up to 200 emails per day</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔧 Setup Instructions
          </h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-900">1. Environment Variables</h3>
              <p>Set up the following environment variables in your Vercel dashboard:</p>
              <ul className="list-disc list-inside mt-2 ml-4">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GMAIL_USER</code> - Your Gmail address</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GMAIL_APP_PASSWORD</code> - Your Gmail app-specific password</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">NVIDIA_API_KEY</code> - Your NVIDIA API key</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">CRON_SECRET</code> - A random secret string for security</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">2. Gmail App Password</h3>
              <p>Create an app-specific password in your Google Account settings under Security → 2-Step Verification → App passwords.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">3. NVIDIA API Key</h3>
              <p>Get your API key from the NVIDIA AI Foundation Models platform.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🧪 Testing
          </h2>
          <p className="text-gray-600 mb-4">
            Use these endpoints to test your setup:
          </p>
          <div className="space-y-2">
            <div>
              <code className="bg-gray-100 px-3 py-2 rounded block">
                GET /api/test-connection
              </code>
              <p className="text-sm text-gray-500 mt-1">Test your email connection and configuration</p>
            </div>
            <div>
              <code className="bg-gray-100 px-3 py-2 rounded block">
                POST /api/cron/process-emails
              </code>
              <p className="text-sm text-gray-500 mt-1">Manually trigger email processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
