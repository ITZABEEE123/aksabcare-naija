import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function GET() {
  try {
    // Test Gmail configuration
    const testResult = await emailService.sendEmail({
      to: 'itzofficialabeee@gmail.com',
      subject: 'AksabCare - Gmail Configuration Test',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">AksabCare</h1>
            <p style="color: #666; margin: 5px 0;">Gmail Configuration Test</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">✅ Gmail Service Working!</h2>
            <p style="color: #475569; line-height: 1.6;">
              This is a test email to confirm that your Gmail SMTP configuration is working correctly.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              <strong>Configuration Details:</strong><br>
              📧 Gmail User: ${process.env.GMAIL_USER || 'Not configured'}<br>
              🔐 App Password: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}<br>
              🕐 Sent: ${new Date().toLocaleString()}<br>
              🌐 Environment: ${process.env.NODE_ENV || 'development'}
            </p>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
          </div>
        </div>
      `
    })

    return NextResponse.json({
      success: testResult,
      message: testResult ? 'Gmail test email sent successfully!' : 'Failed to send test email',
      config: {
        gmail_user: process.env.GMAIL_USER ? 'Configured' : 'Not configured',
        gmail_password: process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'
      }
    })
  } catch (error) {
    console.error('Gmail test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Gmail test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    
    const success = await emailService.sendEmail({
      to: to || 'itzofficialabeee@gmail.com',
      subject: 'AksabCare Email Test - Gmail Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎉 Gmail Configuration Success!</h1>
          <p>This is a test email from your AksabCare application using Gmail SMTP.</p>
          <p><strong>Sent via:</strong> Gmail SMTP</p>
          <p><strong>Gmail User:</strong> ${process.env.GMAIL_USER}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Gmail email service is working correctly!</h3>
            <p>You can now send:</p>
            <ul>
              <li>Appointment confirmations</li>
              <li>Welcome emails</li>
              <li>Password reset emails</li>
              <li>Notifications</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The AksabCare Team
          </p>
        </div>
      `
    })

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Email service error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}