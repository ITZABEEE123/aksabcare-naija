'use client'

import { useState } from 'react'

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null)
  const [email, setEmail] = useState('itzofficialabeee@gmail.com')

  const testEmail = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            📧 Email Configuration Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-500"
                placeholder="Enter email to test"
              />
            </div>
            
            <button
              onClick={testEmail}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Sending Test Email...' : '📧 Send Test Email'}
            </button>
            
            {result && (
              <div className={`p-4 rounded-md ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`flex items-center mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  <span className="text-lg mr-2">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">
                    {result.success ? 'Success!' : 'Failed'}
                  </span>
                </div>
                
                <p className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                
                {result.error && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-600 cursor-pointer">
                      Error Details
                    </summary>
                    <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                      {result.error}
                    </pre>
                  </details>
                )}
                
                {result.success && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      🎉 <strong>Email sent successfully!</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Check your inbox at <strong>{email}</strong> for the test email.
                      It may take a few minutes to arrive.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Current Email Configuration:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>SMTP Host:</strong> smtp.resend.com</p>
                <p><strong>SMTP Port:</strong> 587</p>
                <p><strong>Provider:</strong> Resend</p>
                <p><strong>From Email:</strong> itzofficialabeee@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}