// Import necessary Next.js types and functions
import { NextRequest, NextResponse } from 'next/server'  // For handling HTTP requests and responses
import { auth } from '@/auth'                           // Our authentication system to check who's logged in  
import { prisma } from '@/lib/db/prisma'               // Database connection to query appointments

// This function handles GET requests to /api/chat/access-check/[doctorId]
// It checks if a patient is allowed to chat with a specific doctor
// The doctorId comes from the URL path (like /api/chat/access-check/doctor123)
export async function GET(
  _request: NextRequest,  // The incoming request (we don't use it, so it starts with _)
  { params }: { params: Promise<{ doctorId: string }> }  // URL parameters containing the doctorId
) {
  try {
    // Step 1: Extract the doctorId from the URL parameters
    const { doctorId } = await params
    
    // Step 2: Check who is currently logged in
    const session = await auth()
    
    // Step 3: If no one is logged in, deny access immediately
    if (!session?.user) {
      console.log('❌ Chat access denied: User not logged in')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })  // 401 = Unauthorized
    }

    // Step 4: Set up time calculations for appointment checking
    // We need these to determine if appointments are upcoming, current, or past
    const now = new Date()                                              // Current time
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000) // 30 hours ago
    
    // Step 5: Look for any appointment that gives chat access
    // This includes:
    // 1. Upcoming appointments (SCHEDULED/CONFIRMED)
    // 2. Completed consultations within the last 30 hours
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        patient: {
          userId: session.user.id
        },
        OR: [
          // Upcoming or current appointments
          {
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          },
          // Recently completed consultations (within 30 hours)
          {
            status: 'COMPLETED',
            completedAt: {
              gte: thirtyHoursAgo  // Completed within the last 30 hours
            }
          }
        ]
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    })

    console.log('Chat access check:', {
      doctorId,
      userId: session.user.id,
      appointmentFound: !!activeAppointment,
      appointmentId: activeAppointment?.id,
      appointmentStatus: activeAppointment?.status,
      scheduledDate: activeAppointment?.scheduledDate,
      completedAt: activeAppointment?.completedAt
    })

    if (!activeAppointment) {
      return NextResponse.json({
        hasAccess: false,
        appointmentId: null,
        message: 'No active appointment or recent consultation found with this doctor. Please book a new appointment to chat.'
      })
    }

    // Step 6: Determine the type of access and remaining time
    let accessType = 'unknown'
    let timeRemaining = null
    
    if (activeAppointment.status === 'COMPLETED' && activeAppointment.completedAt) {
      // For completed consultations, check if within 30-hour window
      const completedTime = new Date(activeAppointment.completedAt)
      const thirtyHoursLater = new Date(completedTime.getTime() + 30 * 60 * 60 * 1000)
      const remainingMs = thirtyHoursLater.getTime() - now.getTime()
      
      if (remainingMs > 0) {
        accessType = 'post-consultation'
        timeRemaining = Math.ceil(remainingMs / (1000 * 60 * 60)) // Hours remaining
      } else {
        // Consultation window has expired
        return NextResponse.json({
          hasAccess: false,
          appointmentId: activeAppointment.id,
          message: 'Your 30-hour post-consultation chat window has expired. Please book a new appointment to continue chatting.'
        })
      }
    } else if (activeAppointment.status === 'SCHEDULED' || activeAppointment.status === 'CONFIRMED') {
      const appointmentDate = new Date(activeAppointment.scheduledDate)
      if (appointmentDate > now) {
        accessType = 'pre-appointment'
      } else {
        accessType = 'appointment-window'
      }
    }

    return NextResponse.json({
      hasAccess: true,
      appointmentId: activeAppointment.id,
      appointmentStatus: activeAppointment.status,
      scheduledDate: activeAppointment.scheduledDate,
      updatedAt: activeAppointment.updatedAt,
      accessType,
      timeRemaining,
      message: accessType === 'post-consultation' 
        ? `You have ${timeRemaining} hours remaining to chat after your consultation.`
        : accessType === 'pre-appointment'
        ? 'Chat available before your upcoming appointment.'
        : 'Chat available during your appointment window.'
    })
  } catch (error) {
    console.error('Error checking chat access:', error)
    return NextResponse.json(
      { error: 'Failed to check chat access' },
      { status: 500 }
    )
  }
}
