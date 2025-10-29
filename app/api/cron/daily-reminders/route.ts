import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import EmailService from '@/lib/email/service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailService = new EmailService()

    // Get all doctors who have appointments in the next 2 days
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)
    dayAfterTomorrow.setHours(23, 59, 59, 999)

    const doctorsWithAppointments = await prisma.doctor.findMany({
      where: {
        appointments: {
          some: {
            scheduledDate: {
              gte: tomorrow,
              lte: dayAfterTomorrow
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        }
      },
      distinct: ['id']
    })

    const results = []

    for (const doctor of doctorsWithAppointments) {
      try {
        const success = await emailService.sendDailyDoctorReminder(doctor.id)
        results.push({
          doctorId: doctor.id,
          success,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error(`Failed to send reminder to doctor ${doctor.id}:`, error)
        results.push({
          doctorId: doctor.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Also send appointment reminders to patients (24 hours before)
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: {
          gte: in24Hours,
          lte: in25Hours
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
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
      }
    })

    for (const appointment of upcomingAppointments) {
      try {
        const success = await emailService.sendAppointmentReminder({
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointment: {
            ...appointment,
            symptoms: appointment.symptoms || undefined,
            notes: appointment.notes || undefined,
            meetingUrl: appointment.meetingUrl || undefined
          }
        })
        results.push({
          type: 'patient_reminder',
          appointmentId: appointment.id,
          patientEmail: appointment.patient.user.email,
          success,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error(`Failed to send patient reminder for appointment ${appointment.id}:`, error)
        results.push({
          type: 'patient_reminder',
          appointmentId: appointment.id,
          patientEmail: appointment.patient.user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} email notifications`,
      results,
      doctorsCount: doctorsWithAppointments.length,
      upcomingAppointments: upcomingAppointments.length
    })

  } catch (error) {
    console.error('Daily reminders error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send daily reminders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}