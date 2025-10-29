'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface TestCase {
  name: string;
  amount: number;
  email: string;
  phone: string;
  card: string;
}

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    reference?: string;
    link?: string;
    verification?: unknown;
  } | null>(null)

  const testPayments = [
    {
      name: 'Successful Payment',
      amount: 5000,
      email: 'test@example.com',
      phone: '08123456789',
      card: '5531886652142950'
    },
    {
      name: 'Insufficient Funds',
      amount: 10000,
      email: 'test@example.com', 
      phone: '08123456789',
      card: '5143010522339965'
    },
    {
      name: 'Invalid Card',
      amount: 3000,
      email: 'test@example.com',
      phone: '08123456789', 
      card: '4444333322221111'
    }
  ]

  const handleTestPayment = async (testCase: TestCase) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: testCase.amount,
          doctorId: 'test-doctor-id',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          consultationType: 'VIRTUAL',
          notes: 'Test consultation'
        })
      })

      const data = await response.json()

      if (data.payment_link) {
        // Open payment link in new window for testing
        window.open(data.payment_link, '_blank')
        setResult({
          success: true,
          message: 'Payment initialized successfully',
          reference: data.reference,
          link: data.payment_link
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Payment initialization failed'
        })
      }
    } catch {
      setResult({
        success: false,
        message: 'Network error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (transactionId: string) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction_id: transactionId })
      })

      const data = await response.json()
      if (result) {
        setResult({
          ...result,
          verification: data
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Payment Flow Testing
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {testPayments.map((test, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="font-semibold text-gray-900 mb-4">{test.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>Amount:</strong> ₦{test.amount.toLocaleString()}</p>
                  <p><strong>Test Card:</strong> {test.card}</p>
                  <p><strong>CVV:</strong> 564</p>
                  <p><strong>PIN:</strong> 3310</p>
                  <p><strong>OTP:</strong> 12345</p>
                </div>
                <button
                  onClick={() => handleTestPayment(test)}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Test Payment'}
                </button>
              </motion.div>
            ))}
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
            >
              <h3 className={`font-semibold mb-4 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                Test Result
              </h3>
              <pre className="text-sm bg-white p-4 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.success && result.reference && (
                <button
                  onClick={() => verifyPayment(result.reference!)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Verify Payment
                </button>
              )}
            </motion.div>
          )}

          <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
            <h3 className="font-semibold text-yellow-800 mb-4">Test Card Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Mastercard (Success):</strong> 5531886652142950</p>
                <p><strong>Verve (Success):</strong> 5061460410120223210</p>
                <p><strong>Visa (Success):</strong> 4187427415564246</p>
              </div>
              <div>
                <p><strong>Insufficient Funds:</strong> 5143010522339965</p>
                <p><strong>Invalid Card:</strong> 4444333322221111</p>
                <p><strong>Do Not Honor:</strong> 5061460410120223227</p>
              </div>
            </div>
            <p className="mt-4 text-yellow-700">
              <strong>Universal Test Details:</strong> CVV: 564, PIN: 3310, OTP: 12345
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
