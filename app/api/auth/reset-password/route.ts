import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Find and validate reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if token has expired
    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Check if token has already been used
    if (resetRecord.usedAt) {
      return NextResponse.json({ error: 'Reset token has already been used' }, { status: 400 })
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user's password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      })
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}