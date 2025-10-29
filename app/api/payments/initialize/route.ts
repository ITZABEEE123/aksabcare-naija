import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FlutterwaveService } from '@/lib/payments/flutterwave'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check Flutterwave configuration first
    const hasFlutterwaveConfig = !!(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY && 
      process.env.FLUTTERWAVE_SECRET_KEY
    )

    console.log('Flutterwave configuration:', {
      hasPublicKey: !!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      hasSecretKey: !!process.env.FLUTTERWAVE_SECRET_KEY,
      configured: hasFlutterwaveConfig
    })

    if (!hasFlutterwaveConfig) {
      return NextResponse.json({ 
        error: 'Payment service is not configured. Please contact support.',
        fallback: true,
        debug_url: '/api/debug/test-appointment'
      }, { status: 503 })
    }

    const session = await auth()
    
    console.log('Payment initialization - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })
    
    if (!session?.user) {
      console.log('Payment initialization failed: No valid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      amount, 
      doctorId, 
      scheduledAt, 
      consultationType, 
      notes 
    } = await request.json()

    console.log('Payment initialization - Request data:', {
      amount,
      doctorId,
      scheduledAt,
      consultationType,
      notes
    })

    // Validate input
    if (!amount || !doctorId || !scheduledAt) {
      console.log('Payment initialization failed: Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Get user profile information
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    // Get doctor information
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json({ 
        error: 'Doctor not found' 
      }, { status: 404 })
    }

    // Verify amount matches doctor's fee
    if (amount !== doctor.consultationFee) {
      return NextResponse.json({ 
        error: 'Amount mismatch' 
      }, { status: 400 })
    }

    // Step 8: Generate a unique transaction reference for this payment
    // This helps us track the payment later (like a receipt number)
    const txRef = `aksab_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Step 9: Get the base URL for our website (where users should return after payment)
    // We try multiple environment variables, with port 3000 as the final fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXTAUTH_URL || 
                    'http://localhost:3000'

    // Initialize payment with Flutterwave
    const paymentData = {
      amount: amount,
      currency: 'NGN',
      email: session.user.email!,
      phone: userProfile?.phone || '',
      name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : session.user.email!,
      title: 'AksabHealth Consultation',
      description: `Consultation with Dr. ${doctor.user.profile?.firstName || 'Doctor'} ${doctor.user.profile?.lastName || ''}`,
      logo: `${baseUrl}/logo.png`,
      redirect_url: `${baseUrl}/payment/callback/${txRef}`,
      tx_ref: txRef
    }

    const paymentResponse = await FlutterwaveService.initializePayment(paymentData)

    if (paymentResponse.status === 'success') {
      // Check if payment with this reference already exists
      const existingPayment = await prisma.payment.findUnique({
        where: { reference: txRef }
      })

      // Only create new payment record if one doesn't exist
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            id: txRef,
            userId: session.user.id,
            amount: amount,
            currency: 'NGN',
            status: 'PENDING',
            method: 'CARD',
            provider: 'FLUTTERWAVE',
            reference: txRef,
            providerRef: txRef,
            description: `Consultation with Dr. ${doctor.user.profile?.firstName || 'Doctor'} ${doctor.user.profile?.lastName || ''}`,
            metadata: {
              doctorId,
              scheduledAt,
              consultationType,
              notes,
              doctorName: `Dr. ${doctor.user.profile?.firstName || 'Doctor'} ${doctor.user.profile?.lastName || ''}`,
              patientName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : session.user.email
            }
          }
        })
      }

      return NextResponse.json({
        success: true,
        payment_link: paymentResponse.link,
        reference: txRef
      })
    } else {
      // Log the specific error for debugging
      console.error('Flutterwave payment initialization failed:', {
        status: paymentResponse.status,
        message: paymentResponse.message,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({ 
        error: paymentResponse.message || 'Payment service temporarily unavailable',
        fallback: true,
        debug_url: '/api/debug/test-appointment'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Payment initialization error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Payment initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
