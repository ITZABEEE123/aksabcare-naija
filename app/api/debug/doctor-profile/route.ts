import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Check Dr. Fatima's records
    const email = 'fatibellow@gmail.com'
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        doctor: true,
        patient: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' })
    }

    const doctorProfile = await prisma.doctor.findFirst({
      where: {
        user: { email }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    return NextResponse.json({
      userRecord: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasProfile: !!user.profile,
        hasDoctorProfile: !!user.doctor,
        hasPatientProfile: !!user.patient,
        profileData: user.profile,
        doctorData: user.doctor,
        patientData: user.patient
      },
      doctorProfile: doctorProfile,
      analysis: {
        isProperlyLinked: !!(user.doctor && doctorProfile),
        hasConflicts: !!(user.patient && user.doctor),
        needsLinking: user.role === 'DOCTOR' && !user.doctor
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}