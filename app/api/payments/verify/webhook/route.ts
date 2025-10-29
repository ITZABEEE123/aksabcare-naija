import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PaymentStatus } from '@prisma/client'
import { createHmac } from 'crypto'

// Function to generate Google Meet link
function generateGoogleMeetLink(): string {
  const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  return `https://meet.google.com/${meetingId}`
}

// Flutterwave webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('verif-hash')

    // Verify webhook signature
    const hash = createHmac('sha256', process.env.FLUTTERWAVE_SECRET_HASH!)
      .update(payload, 'utf8')
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const data = JSON.parse(payload)

    if (data.event === 'charge.completed') {
      const { transaction_id, tx_ref } = data.data

      // Get payment details from database
      const payment = await prisma.payment.findUnique({
        where: { reference: tx_ref },
        include: {
          user: {
            include: { 
              profile: true,
              patient: true
            }
          }
        }
      })

      if (!payment) {
        console.error(`Payment not found for reference: ${tx_ref}`)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status in database
      await prisma.payment.update({
        where: { reference: tx_ref },
        data: {
          status: PaymentStatus.SUCCESSFUL,
          providerRef: transaction_id
        }
      })

      // Get appointment data from payment metadata
      const metadata = payment.metadata as Record<string, unknown>
      const doctorId = metadata?.doctorId as string
      const scheduledAt = metadata?.scheduledAt as string
      
      if (doctorId && scheduledAt) {
        // Get doctor details
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          include: {
            user: {
              include: { profile: true }
            }
          }
        })

        if (doctor) {
          // Generate Google Meet link
          const meetingLink = generateGoogleMeetLink()
          
          // Create appointment
          const appointment = await prisma.appointment.create({
            data: {
              patientId: payment.user.patient?.id || payment.userId,
              doctorId: doctorId,
              scheduledDate: new Date(scheduledAt),
              duration: 30,
              type: 'VIDEO_CONSULTATION',
              status: 'CONFIRMED',
              fee: payment.amount,
              currency: payment.currency,
              meetingUrl: meetingLink,
              notes: (metadata?.notes as string) || 'Quick consultation session'
            }
          })

          // Send confirmation email
          try {
            const EmailService = (await import('@/lib/email/service')).default
            const emailService = new EmailService()
            
            const appointmentData = {
              patient: {
                user: {
                  email: payment.user.email,
                  profile: {
                    firstName: payment.user.profile?.firstName || 'Patient',
                    lastName: payment.user.profile?.lastName || ''
                  }
                }
              },
              doctor: {
                user: {
                  email: doctor.user.email,
                  profile: {
                    firstName: doctor.user.profile?.firstName || 'Doctor',
                    lastName: doctor.user.profile?.lastName || ''
                  }
                }
              },
              appointment: {
                id: appointment.id,
                scheduledDate: appointment.scheduledDate,
                type: appointment.type,
                meetingLink: meetingLink,
                notes: appointment.notes || '',
                symptoms: appointment.symptoms || undefined,
                meetingUrl: appointment.meetingUrl || undefined
              }
            }

            await emailService.sendAppointmentConfirmation(appointmentData)
            console.log(`Confirmation email sent for appointment ${appointment.id}`)
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError)
          }

          console.log(`Appointment created: ${appointment.id} for payment ${tx_ref}`)
        }
      }

      console.log(`Payment ${tx_ref} processed successfully`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}