import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { checkAccountConflict } from '@/lib/utils/account-validation'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, role } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true,
        patient: true
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // 🏥 HEALTHCARE SECURITY CHECK: Prevent account role conflicts
    const conflictCheck = await checkAccountConflict(email, role || UserRole.PATIENT);
    
    if (conflictCheck.hasConflict) {
      return NextResponse.json({ 
        error: conflictCheck.message,
        code: conflictCheck.conflictType 
      }, { status: 403 })
    }

    const hashedPassword = await hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role || UserRole.PATIENT,
          isActive: true,
          isVerified: false,
        }
      })

      // Create profile
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone || null
        }
      })

      // Create role-specific records
      if (user.role === UserRole.PATIENT) {
        await tx.patient.create({
          data: {
            userId: user.id,
          }
        })
      } else if (user.role === UserRole.DOCTOR) {
        await tx.doctor.create({
          data: {
            userId: user.id,
            licenseNumber: `TEMP_${uuidv4()}`, // ← UNIQUE for each doctor
            specialization: 'General Practice',
            experience: 0,
            consultationFee: 0,
            education: [],
            certifications: [],
          }
        })
      }

      return { user, profile }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: `${firstName} ${lastName}`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
