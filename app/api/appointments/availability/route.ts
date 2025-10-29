import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const doctorId = url.searchParams.get('doctorId');
    const date = url.searchParams.get('date');
    const time = url.searchParams.get('time');

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required parameters: doctorId, date, time' },
        { status: 400 }
      );
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${date}T${time}`);
    
    // Check for exact time conflict
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        scheduledDate: scheduledDateTime,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
        }
      }
    });

    const isAvailable = !existingAppointment;

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable 
        ? 'Time slot is available' 
        : 'This time slot is already booked'
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}