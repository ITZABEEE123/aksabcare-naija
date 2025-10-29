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

    // Get upcoming appointments for the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        scheduledDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
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
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedAppointments = appointments.map((appointment: {
      id: string;
      scheduledDate: Date;
      notes: string | null;
      type: string;
      patient: {
        user: {
          email: string;
          profile: {
            firstName: string;
            lastName: string;
          } | null;
        };
      };
    }) => ({
      id: appointment.id,
      scheduledAt: appointment.scheduledDate.toISOString(),
      patient: {
        user: {
          profile: {
            firstName: appointment.patient.user.profile?.firstName || '',
            lastName: appointment.patient.user.profile?.lastName || ''
          },
          email: appointment.patient.user.email
        }
      },
      notes: appointment.notes,
      consultationType: appointment.type || 'CONSULTATION'
    }));

    return NextResponse.json({ 
      success: true, 
      appointments: transformedAppointments 
    });

  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}