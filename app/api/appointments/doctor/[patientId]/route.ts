import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the doctor record for the current user
    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Find active appointment between this doctor and patient
    const appointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patientId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'SCHEDULED'] }
      },
      include: {
        patient: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        doctor: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    })

    if (!appointment) {
      return NextResponse.json({ 
        error: 'No active appointment found with this patient' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      appointment
    })
  } catch (error) {
    console.error('Error fetching doctor-patient appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch appointment' 
    }, { status: 500 })
  }
}