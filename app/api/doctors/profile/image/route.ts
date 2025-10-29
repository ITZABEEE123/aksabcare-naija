import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const doctorId = formData.get('doctorId') as string

    if (!file || !doctorId) {
      return NextResponse.json({ error: 'Missing file or doctor ID' }, { status: 400 })
    }

    // Verify the doctor belongs to the current user
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        userId: session.user.id
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found or unauthorized' }, { status: 404 })
    }

    // Check if user has updated profile image in the last month
    // We'll use the user's updatedAt field as an approximation
    // In production, you'd want a dedicated profileImageUpdatedAt field
    const userUpdatedAt = new Date(doctor.user.updatedAt)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    // Only enforce restriction if user already has an avatar (first upload is always allowed)
    if (doctor.user.profile?.avatar && userUpdatedAt > oneMonthAgo) {
      const nextAllowedDate = new Date(userUpdatedAt)
      nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1)
      return NextResponse.json(
        { 
          error: 'Profile image can only be updated once per month',
          nextAllowedDate: nextAllowedDate.toISOString()
        }, 
        { status: 429 }
      )
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory already exists or created
      console.log('Directory already exists or created')
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filepath = path.join(uploadDir, filename)
    const publicUrl = `/uploads/profiles/${filename}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user profile with new avatar URL
    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: { 
        avatar: publicUrl
      }
    })

    return NextResponse.json({ 
      imageUrl: publicUrl,
      message: 'Profile image updated successfully'
    })

  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}