'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [paymentData, setPaymentData] = useState<{
    transaction_id?: string;
    amount?: number;
    verified?: boolean;
    [key: string]: unknown;
  } | null>(null)

  useEffect(() => {
    const handlePaymentCallback = async () => {
      if (!searchParams) {
        setStatus('failed')
        return
      }

      const transactionId = searchParams.get('transaction_id')
      const txRef = searchParams.get('tx_ref')
      const flwStatus = searchParams.get('status')

      if (!transactionId || flwStatus !== 'successful') {
        setStatus('failed')
        return
      }

      try {
        // Verify payment
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef })
        })

        const verificationResult = await verifyResponse.json()

        if (verificationResult.verified) {
          // Create appointment
          const appointmentResponse = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentReference: txRef,
              // Other appointment data from payment metadata
            })
          })

          if (appointmentResponse.ok) {
            setStatus('success')
            setPaymentData(verificationResult)
            
            // Redirect to success page after 3 seconds
            setTimeout(() => {
              window.location.href = '/patient/appointments'
            }, 3000)
          } else {
            setStatus('failed')
          }
        } else {
          setStatus('failed')
        }
      } catch (error) {
        console.error('Payment callback error:', error)
        setStatus('failed')
      }
    }

    handlePaymentCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"
      >
        {status === 'loading' && (
          <div>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your appointment has been booked successfully.</p>
            
            {paymentData && (
              <div className="text-sm text-gray-500">
                <p>Transaction ID: {paymentData.transaction_id}</p>
                <p>Amount: ₦{paymentData.amount?.toLocaleString()}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to your appointments...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t process your payment. Please try again.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/patient/doctors')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                Back to Doctors
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
