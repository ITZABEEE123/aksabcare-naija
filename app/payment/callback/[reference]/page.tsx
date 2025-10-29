// This tells Next.js to run this component on the client (browser) side
// We need this because we're reading URL parameters and redirecting users
'use client'

// Import React hooks for managing state and side effects
import { useEffect, useState } from 'react'
// Import Next.js navigation hooks to get URL info and redirect users
import { useRouter, useSearchParams, useParams } from 'next/navigation'
// Import animation library to make the page look smooth and professional
import { motion } from 'framer-motion'
// Import icons to show success (green checkmark) or failure (red X)
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

// This is the main component that shows after a user completes payment
// Flutterwave redirects users here with payment information in the URL
export default function PaymentCallbackPage() {
  // Get navigation functions to redirect users after processing
  const router = useRouter()
  // Get URL search parameters (like ?status=success&transaction_id=123)
  const searchParams = useSearchParams()
  // Get URL path parameters (like /payment/callback/[reference])
  const params = useParams()
  
  // State to track what's happening with the payment verification
  // loading = we're checking the payment, success = payment worked, failed = payment didn't work
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  
  // State to store appointment information once we verify the payment was successful
  // This includes doctor info, appointment date/time, and appointment type
  const [appointmentData, setAppointmentData] = useState<{
    doctor?: {                              // Doctor information (optional because it might not be loaded)
      user?: {                              // Doctor's user account info
        profile?: {                         // Doctor's profile with personal details
          firstName: string                 // Doctor's first name
          lastName: string                  // Doctor's last name
        }
      }
    }
    scheduledDate: string                   // When the appointment is scheduled for
    type: string                           // Type of appointment (VIDEO_CONSULTATION, etc.)
  } | null>(null)                          // null means no appointment data loaded yet

  useEffect(() => {
    const handlePaymentCallback = async () => {
      const transactionId = searchParams?.get('transaction_id')
      const txRef = params?.reference as string || searchParams?.get('tx_ref')
      const flwStatus = searchParams?.get('status')

      console.log('Payment callback data:', { transactionId, txRef, flwStatus })

      // Don't rely solely on Flutterwave status - verify with our API instead
      if (!transactionId) {
        console.log('No transaction ID found - payment failed')
        setStatus('failed')
        return
      }

      // Check for obviously failed statuses
      if (flwStatus && ['cancelled', 'failed', 'error'].includes(flwStatus.toLowerCase())) {
        console.log('Payment status indicates failure:', flwStatus)
        setStatus('failed')
        return
      }

      try {
        // Always verify payment with our backend regardless of Flutterwave status
        console.log('Verifying payment with backend...')
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef })
        })

        const verificationResult = await verifyResponse.json()
        console.log('Payment verification result:', verificationResult)

        if (verificationResult.verified) {
          // Payment was successful, show success even if appointment creation failed
          if (verificationResult.appointment) {
            setAppointmentData(verificationResult.appointment)
          } else {
            console.warn('Payment successful but appointment not created')
          }
          
          setStatus('success')
          
          // Clear any pending booking data from localStorage
          localStorage.removeItem('pendingBooking')
          
          // Redirect to patient dashboard after 5 seconds
          setTimeout(() => {
            router.push('/patient/doctors')
          }, 5000)
        } else {
          console.log('Payment verification failed:', verificationResult.message)
          setStatus('failed')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('failed')
      }
    }

    handlePaymentCallback()
  }, [searchParams, params, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully.
            </p>
            
            {appointmentData ? (
              <div className="bg-green-50 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-semibold text-green-800 mb-2">Appointment Details:</h3>
                <p className="text-sm text-green-700">
                  <strong>Doctor:</strong> Dr. {appointmentData.doctor?.user?.profile?.firstName} {appointmentData.doctor?.user?.profile?.lastName}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Date:</strong> {new Date(appointmentData.scheduledDate).toLocaleDateString("en-US", {timeZone: "Africa/Lagos"})}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Time:</strong> {new Date(appointmentData.scheduledDate).toLocaleTimeString("en-US", {timeZone: "Africa/Lagos", hour12: true})}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Type:</strong> {appointmentData.type}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">What&apos;s Next:</h3>
                <p className="text-sm text-blue-700">
                  Your appointment details will be available in your dashboard shortly. You will receive a confirmation email once the appointment is processed.
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-4">
              A confirmation email has been sent to your email address.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => router.push('/patient/doctors')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <p className="text-xs text-gray-400">
                Redirecting automatically in 5 seconds...
              </p>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment. Please try again.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/patient/doctors')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/patient/doctors')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}