import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          include: {
            user: { include: { profile: true } }
          }
        },
        patient: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isDoctor = session.user.role === 'DOCTOR' && session.user.doctorId === appointment.doctorId
    const isPatient = session.user.role === 'PATIENT' && session.user.patientId === appointment.patientId

    if (!isDoctor && !isPatient) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes } = await request.json()
    const params = await props.params

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          include: {
            user: { include: { profile: true } }
          }
        },
        patient: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check authorization - only doctor can update appointment status
    if (session.user.role !== 'DOCTOR' || session.user.doctorId !== appointment.doctorId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updateData: {
      status?: AppointmentStatus;
      completedAt?: Date;
      cancelledAt?: Date;
      notes?: string;
    } = {}
    
    if (status) {
      updateData.status = status as AppointmentStatus
      
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        doctor: {
          include: {
            user: { include: { profile: true } }
          }
        },
        patient: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    // Send notification emails based on status change
    if (status === 'CONFIRMED') {
      // Send confirmation email with meeting link
      // await sendAppointmentConfirmationEmail(updatedAppointment)
    } else if (status === 'CANCELLED') {
      // Send cancellation email
      // await sendAppointmentCancellationEmail(updatedAppointment)
    }

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
