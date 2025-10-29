import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// POST: Send a reminder from doctor to patient
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Access denied. Doctor account required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { appointmentId, type, message } = body;

    // Validate required fields - only appointmentId is required
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      );
    }

    // Verify the appointment exists and belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id
      },
      include: {
        patient: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // Check daily reminder limit (3 per patient per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReminderCount = await prisma.doctorReminder.count({
      where: {
        doctorId: doctor.id,
        patientId: appointment.patientId,
        sentAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (todayReminderCount >= 3) {
      return NextResponse.json(
        { 
          error: 'Daily reminder limit reached. You can only send 3 reminders per patient per day.',
          code: 'DAILY_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Auto-generate appropriate reminder message if not provided
    const appointmentDate = new Date(appointment.scheduledDate);
    const patientName = appointment.patient.user.profile?.firstName || 'Patient';
    
    const defaultMessage = message || `Hello ${patientName}, this is a reminder about your upcoming appointment scheduled for ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}. Please ensure you're available at the scheduled time. If you need to reschedule, please contact us in advance.`;

    // Create the reminder notification for the patient
    const notification = await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: type === 'APPOINTMENT' ? 'APPOINTMENT_REMINDER' : 'DOCTOR_MESSAGE',
        title: `Reminder from Dr. ${doctor.user.profile?.firstName || 'Doctor'}`,
        message: defaultMessage,
        relatedId: appointmentId,
        relatedType: 'appointment'
      }
    });

    // Create the doctor reminder record
    const doctorReminder = await prisma.doctorReminder.create({
      data: {
        doctorId: doctor.id,
        patientId: appointment.patientId,
        appointmentId: appointmentId,
        type: type || 'APPOINTMENT',
        message: defaultMessage,
        notificationId: notification.id,
        status: 'SENT'
      },
      include: {
        patient: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        appointment: true,
        notification: true
      }
    });

    return NextResponse.json({
      message: 'Reminder sent successfully',
      reminder: doctorReminder,
      success: true
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}

// GET: Get reminders sent by the doctor
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Access denied. Doctor account required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const patientId = searchParams.get('patientId');
    
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: {
      doctorId: string;
      patientId?: string;
    } = {
      doctorId: doctor.id,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    // Get sent reminders with pagination
    const [reminders, totalCount] = await Promise.all([
      prisma.doctorReminder.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          patient: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          appointment: true,
          notification: true
        }
      }),
      prisma.doctorReminder.count({ where })
    ]);

    return NextResponse.json({
      reminders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + reminders.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}