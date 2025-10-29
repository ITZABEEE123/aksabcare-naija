import { NextRequest, NextResponse } from 'next/server'
import { getDoctorAvailableSlots } from '@/lib/db/doctors'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// Define the DayOfWeek mapping
const DAY_NAME_TO_NUMBER = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    
    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr)
    const slots = await getDoctorAvailableSlots(id, date)
    
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: doctorId } = await params
    const body = await request.json()
    const { schedule } = body

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

    // Delete existing availability for this doctor
    await prisma.doctorAvailability.deleteMany({
      where: { doctorId }
    })

    // Create new availability records
    const availabilityRecords = []
    for (const [dayName, daySchedule] of Object.entries(schedule)) {
      const dayData = daySchedule as { isAvailable: boolean; startTime: string; endTime: string }
      if (dayData.isAvailable && dayData.startTime && dayData.endTime) {
        const dayOfWeek = DAY_NAME_TO_NUMBER[dayName as keyof typeof DAY_NAME_TO_NUMBER]
        if (dayOfWeek !== undefined) {
          availabilityRecords.push({
            doctorId,
            dayOfWeek,
            startTime: dayData.startTime,
            endTime: dayData.endTime,
            isActive: true // Use isActive instead of isAvailable
          })
        }
      }
    }

    if (availabilityRecords.length > 0) {
      await prisma.doctorAvailability.createMany({
        data: availabilityRecords
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Availability schedule updated successfully' 
    })

  } catch (error) {
    console.error('Error saving availability:', error)
    return NextResponse.json(
      { error: 'Failed to save availability schedule' },
      { status: 500 }
    )
  }
}
