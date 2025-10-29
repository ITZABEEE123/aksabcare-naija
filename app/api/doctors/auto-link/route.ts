import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email?.toLowerCase()
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 400 })
    }

    // Check if user already has a doctor profile linked
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id }
    })

    if (existingDoctor) {
      return NextResponse.json({ 
        success: true,
        doctorId: existingDoctor.id,
        message: 'Doctor profile already linked'
      })
    }

    // Find seeded doctor profile by email
    const doctorUser = await prisma.user.findFirst({
      where: { 
        email: userEmail,
        role: 'DOCTOR'
      },
      include: {
        doctor: true,
        profile: true
      }
    })

    if (!doctorUser?.doctor) {
      return NextResponse.json({ 
        error: 'No seeded doctor profile found for this email' 
      }, { status: 404 })
    }

    // Link the authenticated user to the existing doctor profile
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorUser.doctor.id },
      data: { userId: session.user.id }
    })

    // Also ensure the user profile exists and is complete
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        firstName: doctorUser.profile?.firstName || 'Doctor',
        lastName: doctorUser.profile?.lastName || 'User',
        phone: doctorUser.profile?.phone,
        avatar: doctorUser.profile?.avatar
      },
      update: {
        firstName: doctorUser.profile?.firstName || 'Doctor',
        lastName: doctorUser.profile?.lastName || 'User',
        phone: doctorUser.profile?.phone,
        avatar: doctorUser.profile?.avatar
      }
    })

    return NextResponse.json({ 
      success: true,
      doctorId: updatedDoctor.id,
      message: 'Doctor profile linked successfully'
    })

  } catch (error) {
    console.error('Error linking doctor profile:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}