import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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

    // For now, return an empty array since we don't have a reminders table
    // In a real implementation, you would query your reminders table here
    const reminders: Array<{
      id: string;
      appointmentId: string;
      reminderDate: string;
      sent: boolean;
      type: 'email' | 'sms' | 'push';
    }> = [];

    return NextResponse.json({ 
      success: true, 
      reminders: reminders 
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}