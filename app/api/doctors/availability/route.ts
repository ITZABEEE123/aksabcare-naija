import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get doctor's availability schedule
    const availability = await prisma.doctorAvailability.findMany({
      where: { 
        doctorId: session.user.doctorId,
        isActive: true
      },
      orderBy: { dayOfWeek: 'asc' }
    })

    // Convert to weekly schedule format expected by frontend
    const weeklySchedule = {
      monday: { available: false, startTime: '', endTime: '' },
      tuesday: { available: false, startTime: '', endTime: '' },
      wednesday: { available: false, startTime: '', endTime: '' },
      thursday: { available: false, startTime: '', endTime: '' },
      friday: { available: false, startTime: '', endTime: '' },
      saturday: { available: false, startTime: '', endTime: '' },
      sunday: { available: false, startTime: '', endTime: '' }
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    availability.forEach(slot => {
      const dayName = dayNames[slot.dayOfWeek] as keyof typeof weeklySchedule
      if (dayName) {
        weeklySchedule[dayName] = {
          available: true,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      }
    })

    return NextResponse.json({ weeklySchedule })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weeklySchedule } = body

    if (!weeklySchedule) {
      return NextResponse.json({ error: 'Weekly schedule is required' }, { status: 400 })
    }

    const doctorId = session.user.doctorId

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID not found' }, { status: 400 })
    }

    // First, deactivate all existing availability slots
    await prisma.doctorAvailability.updateMany({
      where: { doctorId },
      data: { isActive: false }
    })

    // Convert weeklySchedule to database format
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const availabilitySlots: Array<{
      doctorId: string
      dayOfWeek: number
      startTime: string
      endTime: string
      isActive: boolean
    }> = []

    for (const [dayName, scheduleData] of Object.entries(weeklySchedule)) {
      const schedule = scheduleData as { available: boolean; startTime: string; endTime: string }
      if (schedule.available && schedule.startTime && schedule.endTime) {
        const dayOfWeek = dayNames.indexOf(dayName)
        if (dayOfWeek !== -1) {
          availabilitySlots.push({
            doctorId,
            dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: true
          })
        }
      }
    }

    // Create new availability slots
    if (availabilitySlots.length > 0) {
      await prisma.doctorAvailability.createMany({
        data: availabilitySlots,
        skipDuplicates: true
      })
    }

    return NextResponse.json({ 
      message: 'Availability schedule updated successfully',
      slots: availabilitySlots.length
    })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}