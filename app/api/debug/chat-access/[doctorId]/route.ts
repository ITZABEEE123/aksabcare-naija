import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params
    const session = await auth()
    
    console.log('Debug chat access - Doctor ID:', doctorId)
    console.log('Debug chat access - User session:', session?.user?.id)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', session: null }, { status: 401 })
    }

    // Get all appointments for this user
    const allAppointments = await prisma.appointment.findMany({
      where: {
        patient: {
          userId: session.user.id
        }
      },
      include: {
        doctor: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
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
        createdAt: 'desc'
      }
    })

    // Get appointments with this specific doctor
    const doctorAppointments = allAppointments.filter(apt => apt.doctorId === doctorId)

    // Check current logic
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        patient: {
          userId: session.user.id
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED']
        },
        OR: [
          // Future appointments (allow chat before appointment)
          {
            scheduledDate: {
              gte: now
            }
          },
          // Past appointments within 24 hours (allow chat after appointment)
          {
            scheduledDate: {
              gte: oneDayAgo,
              lte: now
            }
          }
        ]
      },
      include: {
        doctor: {
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
        scheduledDate: 'desc'
      }
    })

    return NextResponse.json({
      debug: {
        doctorId,
        userId: session.user.id,
        currentTime: now.toISOString(),
        oneDayAgo: oneDayAgo.toISOString(),
        totalAppointments: allAppointments.length,
        doctorAppointments: doctorAppointments.length,
        activeAppointment: activeAppointment ? {
          id: activeAppointment.id,
          status: activeAppointment.status,
          scheduledDate: activeAppointment.scheduledDate,
          createdAt: activeAppointment.createdAt,
          doctorId: activeAppointment.doctorId
        } : null,
        hasAccess: !!activeAppointment
      },
      allAppointments: allAppointments.map(apt => ({
        id: apt.id,
        doctorId: apt.doctorId,
        status: apt.status,
        scheduledDate: apt.scheduledDate,
        createdAt: apt.createdAt,
        doctorName: `Dr. ${apt.doctor?.user?.profile?.firstName} ${apt.doctor?.user?.profile?.lastName}`
      })),
      doctorAppointments: doctorAppointments.map(apt => ({
        id: apt.id,
        status: apt.status,
        scheduledDate: apt.scheduledDate,
        createdAt: apt.createdAt
      }))
    })
  } catch (error) {
    console.error('Error in debug chat access:', error)
    return NextResponse.json(
      { error: 'Failed to debug chat access', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}