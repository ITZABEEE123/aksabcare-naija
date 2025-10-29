import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })
    }

    // Get chat messages for the appointment
    const consultation = await prisma.consultationChat.findFirst({
      where: { appointmentId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        appointment: {
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      consultation,
      messages: consultation?.messages || []
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { appointmentId, message, messageType = 'text' } = await request.json()

    if (!appointmentId || !message) {
      return NextResponse.json({ 
        error: 'Appointment ID and message are required' 
      }, { status: 400 })
    }

    // Find or create consultation chat
    let consultation = await prisma.consultationChat.findFirst({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        }
      }
    })

    if (!consultation) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: true,
          patient: true
        }
      })

      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      consultation = await prisma.consultationChat.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          isActive: true
        },
        include: {
          appointment: {
            include: {
              doctor: { include: { user: true } },
              patient: { include: { user: true } }
            }
          }
        }
      })
    }

    // Determine sender role
    const isDoctor = consultation.appointment.doctor.userId === session.user.id
    const isPatient = consultation.appointment.patient.userId === session.user.id

    if (!isDoctor && !isPatient) {
      return NextResponse.json({ error: 'Unauthorized to send message' }, { status: 403 })
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        consultationId: consultation.id,
        senderId: session.user.id,
        senderRole: isDoctor ? 'DOCTOR' : 'PATIENT',
        content: message,
        type: messageType === 'text' ? 'TEXT' : 'FILE',
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      message: chatMessage
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}