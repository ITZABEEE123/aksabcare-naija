import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'
import { emailService } from '@/lib/email/service'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, you will receive a password reset link.' 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetTokenExpiry
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
    const userName = user.profile?.firstName || 'User'

    await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset - AksabCare',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">AksabCare</h1>
            <p style="color: #666; margin: 5px 0;">Healthcare Platform</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hello ${userName},
            </p>
            <p style="color: #475569; line-height: 1.6;">
              We received a request to reset your password for your AksabCare account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #2563eb, #059669); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #475569; line-height: 1.6; font-size: 14px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #475569; line-height: 1.6; font-size: 14px;">
              If you didn't request this password reset, please ignore this email. 
              Your account remains secure.
            </p>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            <p>If you have trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: 'If an account with that email exists, you will receive a password reset link.' 
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}