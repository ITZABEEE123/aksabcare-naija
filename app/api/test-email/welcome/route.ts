import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { to, firstName } = await request.json()
    
    const success = await emailService.sendWelcomeEmail({
      email: to || 'itzofficialabeee@gmail.com',
      firstName: firstName || 'Test User',
      role: 'PATIENT'
    })

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email sent successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send welcome email' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Welcome email test error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Email service error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}