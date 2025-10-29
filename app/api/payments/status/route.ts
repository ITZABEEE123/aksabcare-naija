import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  
  if (!reference) {
    return NextResponse.json({ error: 'Reference parameter required' }, { status: 400 })
  }

  try {
    // Find payment by reference
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference },
          { providerRef: reference },
          { id: reference }
        ]
      },
      include: {
        user: {
          include: {
            profile: true,
            patient: true
          }
        }
      }
    })

    // Find appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        payment: {
          reference
        }
      },
      include: {
        doctor: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        patient: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      reference,
      payment: payment ? {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        metadata: payment.metadata,
        user: payment.user.profile ? {
          name: `${payment.user.profile.firstName} ${payment.user.profile.lastName}`,
          email: payment.user.email
        } : null
      } : null,
      appointment: appointment ? {
        id: appointment.id,
        status: appointment.status,
        scheduledDate: appointment.scheduledDate,
        doctor: appointment.doctor?.user.profile ? {
          name: `Dr. ${appointment.doctor.user.profile.firstName} ${appointment.doctor.user.profile.lastName}`
        } : null
      } : null
    })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}