// Script to clean up duplicate appointments
// Run this once to fix existing duplicate appointments

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateAppointments() {
  try {
    console.log('🔍 Finding duplicate appointments...')
    
    // Find appointments that have duplicates (same patient, doctor, and scheduled time)
    const duplicateGroups = await prisma.appointment.groupBy({
      by: ['patientId', 'doctorId', 'scheduledDate'],
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        id: true
      }
    })

    console.log(`📊 Found ${duplicateGroups.length} groups of duplicate appointments`)

    let totalDeleted = 0

    for (const group of duplicateGroups) {
      // Get all appointments in this duplicate group
      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: group.patientId,
          doctorId: group.doctorId,
          scheduledDate: group.scheduledDate
        },
        orderBy: {
          createdAt: 'asc' // Keep the oldest one
        },
        include: {
          patient: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          doctor: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        }
      })

      if (appointments.length > 1) {
        // Keep the first appointment (oldest) and delete the rest
        const [keepAppointment, ...duplicateAppointments] = appointments
        
        console.log(`📅 Processing duplicates for:`)
        console.log(`   Patient: ${keepAppointment.patient.user.profile.firstName} ${keepAppointment.patient.user.profile.lastName}`)
        console.log(`   Doctor: ${keepAppointment.doctor.user.profile.firstName} ${keepAppointment.doctor.user.profile.lastName}`)
        console.log(`   Time: ${keepAppointment.scheduledDate}`)
        console.log(`   Keeping: ${keepAppointment.id} (created: ${keepAppointment.createdAt})`)
        
        for (const duplicate of duplicateAppointments) {
          console.log(`   Deleting: ${duplicate.id} (created: ${duplicate.createdAt})`)
          await prisma.appointment.delete({
            where: { id: duplicate.id }
          })
          totalDeleted++
        }
        
        console.log('---')
      }
    }

    console.log(`✅ Cleanup complete! Deleted ${totalDeleted} duplicate appointments`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateAppointments()