// Import necessary modules and functions
import { NextRequest, NextResponse } from 'next/server'  // Next.js types for handling HTTP requests and responses
import { FlutterwaveService } from '@/lib/payments/flutterwave'  // Our custom service to talk to Flutterwave payment provider
import { prisma } from '@/lib/db/prisma'  // Database connection to talk to our PostgreSQL database
import { createAppointment } from '@/lib/db/doctors'  // Function to create a new appointment in the database

// This is the main function that handles POST requests to /api/payments/verify
// It gets called when someone completes a payment and we need to check if it was successful
export async function POST(request: NextRequest) {
  try {
    // Step 1: Get the data from the request body
    // The frontend sends us transaction_id and tx_ref to identify the payment
    const { transaction_id, tx_ref } = await request.json()

    // Step 2: Log what we received so we can debug if something goes wrong
    console.log('🔍 Payment verification request received:', { transaction_id, tx_ref })

    // Step 3: Check if we have the required transaction_id
    // Without this, we can't verify anything with Flutterwave
    if (!transaction_id) {
      console.log('❌ Payment verification failed: No transaction ID provided')
      return NextResponse.json({ 
        verified: false, 
        message: 'Transaction ID is required' 
      }, { status: 400 })  // 400 means "Bad Request" - client sent wrong data
    }

    // Step 4: Contact Flutterwave to verify if the payment was actually successful
    // We don't trust the frontend - we always double-check with Flutterwave directly
    console.log('📞 Contacting Flutterwave to verify payment...')
    const verificationResult = await FlutterwaveService.verifyPayment(transaction_id)

    // Step 5: Log what Flutterwave told us about this payment
    console.log('📋 Flutterwave verification result:', verificationResult)

    // Step 6: Check if Flutterwave says the payment was successful
    if (verificationResult.status === 'success') {
      console.log('✅ Flutterwave confirmed payment was successful!')
      
      // Step 7: Now we need to find our payment record in our database
      // We look for it using different possible identifiers
      let payment = null
      
      // First, try to find the payment using tx_ref if we have it
      if (tx_ref) {
        console.log('🔍 Searching for payment record using tx_ref:', tx_ref)
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { reference: tx_ref },          // Look for exact reference match
              { providerRef: tx_ref },        // Look for provider reference match  
              { id: tx_ref }                  // Look for ID match
            ]
          },
          // Also get the user information and patient details from the database
          // We need this to create the appointment later
          include: {
            user: {
              include: { 
                profile: true,    // User's personal info (name, phone, etc.)
                patient: true     // Patient-specific medical info
              }
            }
          }
        })
      }

      // Step 8: If we still haven't found the payment, try using transaction_id instead
      if (!payment) {
        console.log('🔍 Payment not found with tx_ref, trying transaction_id:', transaction_id)
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { reference: transaction_id },    // Look for reference matching transaction_id
              { providerRef: transaction_id }   // Look for provider reference matching transaction_id
            ]
          },
          // Get the same user and patient information as before
          include: {
            user: {
              include: { 
                profile: true,    // User's personal info (name, phone, etc.)
                patient: true     // Patient-specific medical info
              }
            }
          }
        })
      }

      // Step 9: Log whether we found the payment record or not
      console.log('💳 Payment record found:', !!payment)

      // Step 10: If we still can't find the payment in our database, that's a problem
      // This shouldn't happen, but sometimes there are race conditions or other issues
      if (!payment) {
        console.log('⚠️ Payment record not found in our database, attempting to create from Flutterwave data')
        
        // Try to extract metadata from Flutterwave response
        const flwData = verificationResult.data
        if (flwData && flwData.tx_ref) {
          // Create payment record from Flutterwave data
          payment = await prisma.payment.create({
            data: {
              id: flwData.tx_ref,
              userId: 'unknown', // This will need to be updated
              amount: flwData.amount || 0,
              currency: flwData.currency || 'NGN',
              status: 'SUCCESSFUL',
              method: 'CARD',
              provider: 'FLUTTERWAVE',
              reference: flwData.tx_ref,
              providerRef: transaction_id,
              description: 'Consultation Payment',
              metadata: {}
            },
            include: {
              user: {
                include: { 
                  profile: true,
                  patient: true
                }
              }
            }
          })
        }
        
        if (!payment) {
          return NextResponse.json({
            verified: false,
            message: 'Payment record not found and could not be created'
          }, { status: 404 })
        }
      }

      // Update payment status if not already successful
      if (payment.status !== 'SUCCESSFUL') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'SUCCESSFUL',
            updatedAt: new Date()
          }
        })
      }

      // Check if appointment already exists for this payment
      const existingAppointment = await prisma.appointment.findFirst({
        where: { 
          payment: {
            reference: payment.reference
          }
        }
      })

      let appointment = existingAppointment

      // Step 11: Check detailed information about why appointment creation might fail
      console.log('💊 Payment verification details:', {
        paymentId: payment.id,
        hasMetadata: !!payment.metadata,
        metadata: payment.metadata,
        hasPatient: !!payment.user.patient,
        patientId: payment.user.patient?.id,
        existingAppointment: !!existingAppointment
      })

      // Step 12: If no appointment exists and we have payment metadata, create the appointment
      if (!existingAppointment && payment.metadata) {
        // First, ensure the user has a patient record
        let patientRecord = payment.user.patient
        
        if (!patientRecord) {
          console.log('⚕️ Creating patient record for user who made payment:', payment.user.id)
          try {
            patientRecord = await prisma.patient.create({
              data: {
                userId: payment.user.id,
                // Set some basic defaults - user can update these later
                bloodGroup: undefined,
                allergies: undefined,
                medicalHistory: undefined,
                currentMedications: undefined,
                insurance: undefined
              }
            })
            console.log('✅ Patient record created successfully with ID:', patientRecord.id)
          } catch (patientError) {
            console.error('❌ Failed to create patient record:', patientError)
            return NextResponse.json({
              verified: false,
              message: 'Could not create patient record for appointment'
            }, { status: 500 })
          }
        }
        
        // Step 13: Now create the appointment using the payment metadata
        const metadata = payment.metadata as {
          doctorId: string
          scheduledAt: string
          consultationType?: string
          notes?: string
        }
        
        console.log('📅 Creating appointment with metadata:', metadata)
        console.log('👤 Patient ID:', patientRecord.id)
        console.log('👨‍⚕️ Doctor ID from metadata:', metadata.doctorId)
        console.log('⏰ Scheduled date from metadata:', metadata.scheduledAt)
        
        try {
          // Parse scheduledAt from metadata (already UTC ISO string)
          const scheduledAtDate = new Date(metadata.scheduledAt)

          // Idempotency: if an appointment already exists for this patient, doctor and time,
          // don't create a new one. This prevents duplicate rows when both app flow and
          // webhook/verification try to create the appointment.
          // Match within a small tolerance (±1 minute) to avoid millisecond drift mismatches
          const toleranceMs = 60 * 1000
          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              patientId: patientRecord.id,
              doctorId: metadata.doctorId,
              scheduledDate: {
                gte: new Date(scheduledAtDate.getTime() - toleranceMs),
                lte: new Date(scheduledAtDate.getTime() + toleranceMs)
              }
            }
          })

          if (existingAppointment) {
            // Only reuse if it's an active booking; otherwise create a new one
            if (['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(existingAppointment.status)) {
              appointment = existingAppointment
              console.log('ℹ️ Reusing existing appointment:', appointment.id)
            } else {
              appointment = await createAppointment({
                patientId: patientRecord.id,
                doctorId: metadata.doctorId,
                scheduledDate: scheduledAtDate,
                type: 'VIDEO_CONSULTATION',
                notes: metadata.notes || 'Consultation appointment',
                fee: payment.amount
              })
            }
          } else {
            appointment = await createAppointment({
              patientId: patientRecord.id,  // Use the patientRecord we found or created
              doctorId: metadata.doctorId,
              scheduledDate: scheduledAtDate,
              type: 'VIDEO_CONSULTATION',
              notes: metadata.notes || 'Consultation appointment',
              fee: payment.amount
            })
          }
          
          console.log('Appointment created successfully:', appointment?.id)
          
          // Link the payment to the appointment
          if (appointment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { appointmentId: appointment.id }
            })
            console.log('Payment linked to appointment')
          }
          
        } catch (appointmentError) {
          console.error('Failed to create appointment:', appointmentError)
          console.error('Appointment error details:', {
            message: appointmentError instanceof Error ? appointmentError.message : 'Unknown error',
            stack: appointmentError instanceof Error ? appointmentError.stack : undefined
          })
          // Continue even if appointment creation fails
        }
      }

      return NextResponse.json({
        verified: true,
        message: 'Payment verified successfully',
        transaction_id: transaction_id,
        amount: verificationResult.data?.amount,
        currency: verificationResult.data?.currency,
        status: verificationResult.data?.status,
        customer: verificationResult.data?.customer,
        payment: payment,
        appointment: appointment ? await prisma.appointment.findUnique({
          where: { id: appointment.id },
          include: {
            doctor: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            },
            patient: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        }) : null
      })
    } else {
      return NextResponse.json({
        verified: false,
        message: verificationResult.message || 'Payment verification failed'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      verified: false,
      message: 'Payment verification service error'
    }, { status: 500 })
  }
}