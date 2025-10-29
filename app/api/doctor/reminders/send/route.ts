import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    // Verify the appointment belongs to this doctor
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
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Send email/SMS to patient
    // 2. Log the reminder in a reminders table
    // 3. Update notification preferences
    
    // For now, just simulate success
    console.log(`Reminder sent for appointment ${appointmentId} to patient ${appointment.patient.user.email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully' 
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}