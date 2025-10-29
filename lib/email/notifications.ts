import nodemailer from 'nodemailer'

// Configure email transporter (you can use any email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

interface Appointment {
  id: string
  scheduledDate: string  // Fixed: changed from scheduledAt to scheduledDate to match schema
  meetingLink?: string
  notes?: string
  doctor: {
    user: {
      profile: {
        firstName: string
        lastName: string
      }
    }
  }
  patient: {
    user: {
      email: string
      profile: {
        firstName: string
        lastName: string
      }
    }
  }
}

export async function sendAppointmentConfirmationEmail(appointment: Appointment) {
  const { patient, doctor } = appointment

  const mailOptions = {
    from: `"AksabHealth" <${process.env.SMTP_FROM_EMAIL}>`,
    to: patient.user.email,
    subject: 'Appointment Confirmed - AksabHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your consultation with Dr. ${doctor.user.profile.lastName} is confirmed</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Appointment Details</h2>
          
          <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Doctor:</strong> Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date & Time:</strong> ${new Date(appointment.scheduledDate).toLocaleString('en-US', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> 60 minutes</p>
            <p style="margin: 0;"><strong>Type:</strong> Virtual Consultation</p>
          </div>

          ${appointment.meetingLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appointment.meetingLink}" 
                 style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Join Google Meet
              </a>
            </div>
          ` : ''}

          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #92400E;"><strong>Important:</strong> Please join the meeting 5 minutes before the scheduled time.</p>
          </div>

          <div style="margin-top: 30px; text-align: center; color: #6B7280;">
            <p>Need help? Contact us at support@aksabhealth.ng</p>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Confirmation email sent to ${patient.user.email}`)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}

export async function sendAppointmentCancellationEmail(appointment: Appointment) {
  const { patient, doctor } = appointment

  const mailOptions = {
    from: `"AksabHealth" <${process.env.SMTP_FROM_EMAIL}>`,
    to: patient.user.email,
    subject: 'Appointment Cancelled - AksabHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #DC2626; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Appointment Cancelled</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your consultation has been cancelled</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p>Dear ${patient.user.profile.firstName},</p>
          
          <p>We regret to inform you that your appointment with Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName} 
             scheduled for ${new Date(appointment.scheduledDate).toLocaleString('en-US', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })} has been cancelled.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/patient/doctors" 
               style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Book Another Appointment
            </a>
          </div>

          <p>If you have any questions, please don't hesitate to contact our support team.</p>

          <div style="margin-top: 30px; text-align: center; color: #6B7280;">
            <p>Need help? Contact us at support@aksabhealth.ng</p>
          </div>
        </div>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Cancellation email sent to ${patient.user.email}`)
  } catch (error) {
    console.error('Error sending cancellation email:', error)
  }
}
