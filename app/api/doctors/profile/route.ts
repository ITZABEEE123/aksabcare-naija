import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch doctor profile with all related data
    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    return NextResponse.json({ doctor })
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      bio,
      education,
      certifications,
      consultationFee,
      languages,
      isAvailable,
      phone,
      dateOfBirth
    } = body

    // Update doctor profile - only editable fields
    const updatedDoctor = await prisma.doctor.update({
      where: { userId: user.id },
      data: {
        bio: bio || null,
        education: education || [],
        certifications: certifications || [],
        consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
        languages: languages || [],
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    // Update user profile for phone and dateOfBirth if provided
    if (phone !== undefined || dateOfBirth !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(phone !== undefined && { phone: phone || null }),
          ...(dateOfBirth !== undefined && { 
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null 
          })
        },
        create: {
          userId: user.id,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
        }
      })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      doctor: updatedDoctor 
    })
  } catch (error) {
    console.error('Error updating doctor profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}