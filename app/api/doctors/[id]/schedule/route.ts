import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// Define the DayOfWeek mapping
const DAY_OF_WEEK_MAP = {
  0: 'sunday',
  1: 'monday', 
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
} as const

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: doctorId } = await params

    // Verify the doctor owns this profile
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        user: { email: session.user.email || undefined }
      }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found or unauthorized' }, { status: 404 })
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' }
    })

    // Convert to schedule format
    const schedule: Record<DayKey, { isAvailable: boolean; startTime: string; endTime: string }> = {
      monday: { isAvailable: false, startTime: '', endTime: '' },
      tuesday: { isAvailable: false, startTime: '', endTime: '' },
      wednesday: { isAvailable: false, startTime: '', endTime: '' },
      thursday: { isAvailable: false, startTime: '', endTime: '' },
      friday: { isAvailable: false, startTime: '', endTime: '' },
      saturday: { isAvailable: false, startTime: '', endTime: '' },
      sunday: { isAvailable: false, startTime: '', endTime: '' }
    }

    availability.forEach(slot => {
      const dayKey = DAY_OF_WEEK_MAP[slot.dayOfWeek as keyof typeof DAY_OF_WEEK_MAP]
      if (dayKey && schedule[dayKey]) {
        schedule[dayKey] = {
          isAvailable: slot.isActive, // Use isActive from schema
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability schedule' },
      { status: 500 }
    )
  }
}