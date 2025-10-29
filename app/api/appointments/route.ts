import { NextRequest, NextResponse } from 'next/server'
import { createAppointment } from '@/lib/db/doctors'
import { AppointmentType } from '@prisma/client'
import { auth } from '@/auth' // Use the auth function from your auth config

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure patientId exists on session.user
    const patientId = session.user.id // Assuming user.id is the patientId for a patient role
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID not found in session' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { doctorId, scheduledDate, type, notes, fee } = body

    // Parse the scheduled date directly - it's already in the correct format from frontend
    const appointmentDate = new Date(scheduledDate);

    // Verify payment here (implement payment verification)
    // const paymentVerified = await verifyFlutterwavePayment(paymentReference)
    // if (!paymentVerified) {
    //   return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    // }

    const appointment = await createAppointment({
      patientId,
      doctorId,
      scheduledDate: appointmentDate,
      type: type as AppointmentType,
      notes,
      fee
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    
    // Handle specific conflict error
    if (error instanceof Error && error.message.includes('time slot is already booked')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict status code
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}