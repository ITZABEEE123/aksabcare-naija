import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'
import { checkAccountConflict } from '@/lib/utils/account-validation'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      licenseNumber, 
      specialization, 
      experience, 
      consultationFee,
      country = 'Nigeria',
      currency = 'NGN',
      languages = ['English'],
      bio,
      education,
      certifications
    } = body

    // Check if doctor profile already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id }
    })

    if (existingDoctor) {
      return NextResponse.json({ 
        error: 'Doctor profile already exists',
        doctorId: existingDoctor.id 
      }, { status: 409 })
    }

    // 🏥 HEALTHCARE SECURITY CHECK: Prevent account role conflicts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const conflictCheck = await checkAccountConflict(user.email, 'DOCTOR', session.user.id);
    
    if (conflictCheck.hasConflict) {
      return NextResponse.json({ 
        error: conflictCheck.message,
        code: conflictCheck.conflictType 
      }, { status: 403 })
    }

    // Create doctor profile
    const doctor = await prisma.doctor.create({
      data: {
        userId: session.user.id,
        licenseNumber,
        specialization,
        experience: parseInt(experience),
        consultationFee: parseFloat(consultationFee),
        country,
        currency,
        languages,
        bio: bio || '',
        education: education || {},
        certifications: certifications || {},
        subSpecializations: [],
        isAvailable: true,
        rating: 0,
        totalConsultations: 0
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
      message: 'Doctor profile created successfully',
      doctor
    })
  } catch (error: unknown) {
    console.error('Error creating doctor profile:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002' && 
        'meta' in error && error.meta && typeof error.meta === 'object' && 
        'target' in error.meta && Array.isArray(error.meta.target) && 
        error.meta.target.includes('licenseNumber')) {
      return NextResponse.json({ 
        error: 'License number already exists' 
      }, { status: 409 })
    }
    
    return NextResponse.json(
      { error: 'Failed to create doctor profile' },
      { status: 500 }
    )
  }
}