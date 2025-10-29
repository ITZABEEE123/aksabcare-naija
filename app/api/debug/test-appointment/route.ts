import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { createAppointment } from '@/lib/db/doctors'

// TEST/FALLBACK: Direct appointment creation (bypassing payment for development)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { doctorId, scheduledAt, notes } = await request.json()

    if (!doctorId || !scheduledAt) {
      return NextResponse.json({ 
        error: 'Doctor ID and scheduled time are required' 
      }, { status: 400 })
    }

    // Ensure user has a patient record
    let patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: session.user.id
        }
      })
    }

    // Get doctor info for fee
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { consultationFee: true }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Create appointment directly
    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId,
      scheduledDate: new Date(scheduledAt),
      type: 'VIDEO_CONSULTATION',
      notes: notes || 'Test consultation appointment',
      fee: doctor.consultationFee
    })

    // Create a test payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        appointmentId: appointment.id,
        amount: doctor.consultationFee,
        currency: 'NGN',
        status: 'SUCCESSFUL',
        method: 'CARD',
        provider: 'FLUTTERWAVE',
        reference: `test_${Date.now()}`,
        description: 'Test consultation payment'
      }
    })

    return NextResponse.json({
      success: true,
      appointment,
      payment,
      message: 'Test appointment created successfully'
    })

  } catch (error) {
    console.error('Test appointment creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create test appointment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}