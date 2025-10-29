import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST() {
  try {
    const appointmentData = {
      patient: {
        user: {
          email: 'itzofficialabeee@gmail.com',
          profile: {
            firstName: 'Test',
            lastName: 'Patient'
          }
        }
      },
      doctor: {
        user: {
          email: 'doctor@test.com',
          profile: {
            firstName: 'John',
            lastName: 'Smith'
          }
        }
      },
      appointment: {
        id: 'test-appointment-123',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'VIDEO_CONSULTATION',
        notes: 'This is a test appointment for email testing',
        meetingLink: 'https://meet.google.com/test-meeting'
      }
    }
    
    const success = await emailService.sendAppointmentConfirmation(appointmentData)

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Appointment confirmation email sent successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send appointment confirmation email' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Appointment confirmation test error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Email service error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}