import * as nodemailer from 'nodemailer';
import { prisma } from '@/lib/db/prisma';

// #region --- Type Definitions ---
interface UserProfile {
  firstName: string;
  lastName: string;
}

interface User {
  email: string;
  profile: UserProfile | null;
}

interface Doctor {
  user: User;
}

interface Patient {
  user: User;
}

interface Appointment {
  id: string;
  scheduledDate: Date;
  type: string;
  symptoms?: string;
  notes?: string;
  meetingLink?: string;
  meetingUrl?: string;
  doctor?: Doctor;
  patient?: Patient;
}

interface AppointmentEmailData {
  patient: Patient;
  doctor: Doctor;
  appointment: Appointment;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference?: string;
  method?: string;
  paidAt?: Date;
}

interface PaymentEmailData extends AppointmentEmailData {
  payment: Payment;
}
// #endregion

/**
 * An enhanced email service for handling all application-related email communications.
 * It supports both custom SMTP and Gmail configurations with a fallback mechanism.
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure transporter based on available environment variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // Use custom SMTP configuration if all details are provided
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false, // Useful for development with self-signed certs
        },
      });
    } else {
      // Fallback to Gmail SMTP (requires app password if 2FA is enabled)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD,
        },
      });
    }

    this.verifyConnection();
  }

  /**
   * Verifies the SMTP connection on initialization.
   */
  private async verifyConnection() {
    try {
      if (this.isConfigured()) {
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
      } else {
        console.warn('⚠️ Email service not configured - emails will not be sent.');
      }
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
    }
  }

  /**
   * Checks if the necessary environment variables for sending emails are set.
   */
  private isConfigured(): boolean {
    const customSmtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    const gmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    return customSmtpConfigured || gmailConfigured;
  }

  /**
   * Sends a confirmation email to the patient after an appointment is booked.
   */
  async sendAppointmentConfirmation(appointmentData: AppointmentEmailData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email not configured - appointment confirmation not sent');
      return false;
    }

    try {
      const { patient, doctor, appointment } = appointmentData;
      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: patient.user.email,
        subject: `Appointment Confirmed - Dr. ${doctor.user.profile?.lastName || 'Unknown'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Appointment Confirmed! ✅</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your consultation with Dr. ${doctor.user.profile?.lastName || 'Doctor'} is confirmed.</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Appointment Details</h2>
              <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;"><strong>Doctor:</strong> Dr. ${doctor.user.profile?.firstName || ''} ${doctor.user.profile?.lastName || 'Unknown'}</p>
                <p style="margin: 0 0 10px 0;"><strong>Date & Time:</strong> ${new Date(appointment.scheduledDate).toLocaleString("en-US", {timeZone: "Africa/Lagos", weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})} (WAT)</p>
                <p style="margin: 0;"><strong>Type:</strong> ${appointment.type}</p>
              </div>
              ${appointment.meetingLink ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appointment.meetingLink}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Join Video Consultation
                  </a>
                </div>
              ` : ''}
              <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #92400E;"><strong>Important:</strong> Please join the meeting 5 minutes before the scheduled time.</p>
              </div>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280;">
              <p>Need help? Contact us at <a href="mailto:support@aksabcare.ng" style="color: #3B82F6;">support@aksabcare.ng</a></p>
              <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Appointment confirmation sent to ${patient.user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending appointment confirmation:', error);
      return false;
    }
  }

  /**
   * Sends a notification email to the doctor when a new appointment is booked.
   */
  async sendDoctorAppointmentNotification(appointmentData: AppointmentEmailData): Promise<boolean> {
     if (!this.isConfigured()) {
      console.log('📧 Email not configured - doctor notification not sent');
      return false;
    }
    
    try {
      const { patient, doctor, appointment } = appointmentData;
      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: doctor.user.email,
        subject: `New Appointment: ${patient.user.profile?.firstName || 'Patient'} ${patient.user.profile?.lastName || 'Unknown'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">New Appointment Booked! 📅</h1>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1F2937;">Patient & Appointment Details</h2>
              <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p><strong>Patient:</strong> ${patient.user.profile?.firstName || ''} ${patient.user.profile?.lastName || 'Unknown'}</p>
                <p><strong>Date & Time:</strong> ${new Date(appointment.scheduledDate).toLocaleString("en-US", {timeZone: "Africa/Lagos", weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true})} (WAT)</p>
                <p><strong>Type:</strong> ${appointment.type}</p>
                ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/doctor/appointments" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    View in Dashboard
                  </a>
              </div>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280;">
              <p>© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Doctor notification sent to ${doctor.user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending doctor notification:', error);
      return false;
    }
  }

  /**
   * Sends a reminder email to a patient 24 hours before their appointment.
   */
  async sendAppointmentReminder(appointmentData: AppointmentEmailData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('📧 Email not configured - appointment reminder not sent');
      return false;
    }

    try {
      const { patient, doctor, appointment } = appointmentData;
      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: patient.user.email,
        subject: `Reminder: Your Appointment Tomorrow with Dr. ${doctor.user.profile?.lastName || 'Doctor'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Appointment Reminder! ⏰</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Don't forget your consultation tomorrow.</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1F2937;">Tomorrow's Appointment</h2>
              <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #F59E0B;">
                <p><strong>Doctor:</strong> Dr. ${doctor.user.profile?.firstName || ''} ${doctor.user.profile?.lastName || 'Unknown'}</p>
                <p><strong>Date & Time:</strong> ${new Date(appointment.scheduledDate).toLocaleString()}</p>
                <p><strong>Type:</strong> ${appointment.type}</p>
              </div>
              ${appointment.meetingLink ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appointment.meetingLink}" style="background: #F59E0B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Join Video Consultation
                  </a>
                </div>
              ` : ''}
              <div style="margin-top: 30px; text-align: center; color: #6B7280;">
                <p>Need to reschedule? <a href="${process.env.NEXT_PUBLIC_BASE_URL}/patient/appointments" style="color: #3B82F6;">Manage your appointments</a></p>
              </div>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280;">
              <p>© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Appointment reminder sent to ${patient.user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending appointment reminder:', error);
      return false;
    }
  }

  /**
   * Sends a payment confirmation and receipt to the patient.
   */
  async sendPaymentConfirmation(paymentData: PaymentEmailData): Promise<boolean> {
     if (!this.isConfigured()) {
      console.log('📧 Email not configured - payment confirmation not sent');
      return false;
    }
    
    try {
      const { patient, doctor, appointment, payment } = paymentData;
      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: patient.user.email,
        subject: `Payment Confirmed - Ref: ${payment.reference || payment.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Payment Successful! 💳</h1>
            </div>
            <div style="padding: 30px; background: white;">
              <div style="background: #ECFDF5; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10B981;">
                <h2 style="color: #1F2937;">Payment Details</h2>
                <p><strong>Amount Paid:</strong> ₦${payment.amount.toLocaleString()}</p>
                <p><strong>Transaction ID:</strong> ${payment.reference || payment.id}</p>
                <p><strong>Date:</strong> ${new Date(payment.paidAt || new Date()).toLocaleString()}</p>
              </div>
              <div style="background: #F9FAFB; padding: 20px; border-radius: 12px;">
                <h2 style="color: #1F2937;">Appointment Information</h2>
                <p><strong>Doctor:</strong> Dr. ${doctor.user.profile?.firstName || ''} ${doctor.user.profile?.lastName || 'Unknown'}</p>
                <p><strong>Date & Time:</strong> ${new Date(appointment.scheduledDate).toLocaleString()}</p>
              </div>
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280;">
              <p>Questions about your payment? Contact <a href="mailto:billing@aksabcare.ng" style="color: #3B82F6;">billing@aksabcare.ng</a></p>
              <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Payment confirmation sent to ${patient.user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending payment confirmation:', error);
      return false;
    }
  }

  /**
   * Sends a daily schedule summary to a doctor.
   */
  async sendDailyDoctorReminder(doctorId: string): Promise<boolean> {
     if (!this.isConfigured()) {
      console.log('📧 Email not configured - daily doctor reminder not sent');
      return false;
    }
    
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const startOfTomorrow = new Date(endOfToday.getTime() + 1);
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const fullInclude = {
          patient: { include: { user: { include: { profile: true } } } },
          doctor: { include: { user: { include: { profile: true } } } }
      };

      const todayAppointments = await prisma.appointment.findMany({
        where: { doctorId, scheduledDate: { gte: startOfToday, lt: endOfToday } },
        include: fullInclude,
        orderBy: { scheduledDate: 'asc' }
      }) as Appointment[];

      const tomorrowAppointments = await prisma.appointment.findMany({
        where: { doctorId, scheduledDate: { gte: startOfTomorrow, lt: endOfTomorrow } },
        include: fullInclude,
        orderBy: { scheduledDate: 'asc' }
      }) as Appointment[];

      if (todayAppointments.length === 0 && tomorrowAppointments.length === 0) {
        console.log(`No appointments for Dr. ID ${doctorId} today or tomorrow. No reminder sent.`);
        return true;
      }
      
      const doctor = todayAppointments[0]?.doctor || tomorrowAppointments[0]?.doctor;
      if (!doctor) return false;

      const appointmentToHtml = (apt: Appointment) => `
        <div style="background: #DBEAFE; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">${new Date(apt.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 0; color: #374151;">Patient: ${apt.patient?.user?.profile?.firstName || ''} ${apt.patient?.user?.profile?.lastName || 'Unknown'}</p>
          <p style="margin: 0; color: #6B7280; font-size: 14px;">Type: ${apt.type}</p>
        </div>
      `;

      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: doctor.user.email,
        subject: `Your Daily Schedule - ${startOfToday.toDateString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Your Daily Schedule 📅</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${startOfToday.toDateString()}</p>
            </div>
            <div style="padding: 30px; background: white;">
              ${todayAppointments.length > 0 ? `
                <h2 style="color: #1F2937;">Today's Appointments (${todayAppointments.length})</h2>
                ${todayAppointments.map(appointmentToHtml).join('')}
              ` : '<p style="text-align: center; padding: 20px 0;">No appointments scheduled for today.</p>'}
              
              ${tomorrowAppointments.length > 0 ? `
                <h2 style="color: #1F2937; margin-top: 30px;">Tomorrow's Appointments (${tomorrowAppointments.length})</h2>
                ${tomorrowAppointments.map(appointmentToHtml).join('')}
              ` : ''}
            </div>
            <div style="background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280;">
              <p>© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Daily reminder sent to Dr. ${doctor.user.profile?.lastName || doctor.user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending daily doctor reminder:', error);
      return false;
    }
  }

  /**
   * Sends a welcome email to a new user upon registration.
   */
  async sendWelcomeEmail(userData: { email: string; firstName: string; role: 'PATIENT' | 'DOCTOR' }): Promise<boolean> {
     if (!this.isConfigured()) {
      console.log('📧 Email not configured - welcome email not sent');
      return false;
    }
    
    try {
      const mailOptions = {
        from: `AksabCare <${process.env.SMTP_FROM_EMAIL}>`,
        to: userData.email,
        subject: `Welcome to AksabCare! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 40px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 32px;">Welcome to AksabCare!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Your healthcare journey starts here.</p>
            </div>
            <div style="padding: 40px; background: white;">
              <h2 style="color: #1F2937;">Hello ${userData.firstName}! 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                Thank you for joining AksabCare, Nigeria's leading digital healthcare platform. We're excited to help you access quality healthcare services conveniently and affordably.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/${userData.role.toLowerCase()}" style="background: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Go to Your Dashboard
                </a>
              </div>
            </div>
            <div style="background: #1F2937; padding: 30px; text-align: center; color: white;">
              <p style="margin: 0; opacity: 0.7; font-size: 14px;">© ${new Date().getFullYear()} AksabCare. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${userData.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * A generic method for sending any HTML email.
   */
  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`📧 Email not configured - email to ${to} not sent`);
      return false;
    }

    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER;
      const mailOptions = {
        from: `AksabCare <${fromEmail}>`,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error);
      return false;
    }
  }
}

// Export a singleton instance to be used throughout the application
export const emailService = new EmailService();

export default EmailService;