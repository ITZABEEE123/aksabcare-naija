import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        password: true,
        updatedAt: true,
        doctor: {
          select: { id: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify this is a doctor
    if (!user.doctor) {
      return NextResponse.json(
        { error: 'Only doctors can update passwords through this endpoint' },
        { status: 403 }
      )
    }

    // Check if password was updated in the last 24 hours
    const lastUpdate = new Date(user.updatedAt)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    if (lastUpdate > twentyFourHoursAgo) {
      const nextAllowedDate = new Date(lastUpdate)
      nextAllowedDate.setHours(nextAllowedDate.getHours() + 24)
      return NextResponse.json(
        {
          error: 'Password can only be changed once per day',
          nextAllowedDate: nextAllowedDate.toISOString()
        },
        { status: 429 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: 'Password updated successfully',
      nextAllowedUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    )
  }
}