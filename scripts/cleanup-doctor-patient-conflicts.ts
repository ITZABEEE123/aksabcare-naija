// 🧹 CLEANUP SCRIPT: Remove Duplicate Patient Accounts for Doctors
// ================================================================
// This script identifies doctors who also have patient accounts with the same email
// and removes the patient accounts to maintain data integrity.
//
// 🚨 SECURITY ISSUE: Doctors should only have doctor accounts, not patient accounts
// 
// What this script does:
// 1. Find all users who have both doctor AND patient accounts with same email
// 2. Remove the patient accounts (keeping only doctor accounts)
// 3. Clean up associated patient data
// 4. Report what was cleaned up

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateAccounts() {
  console.log('🧹 Starting cleanup of duplicate doctor/patient accounts...\n')

  try {
    // Step 1: Find all doctor emails
    const allDoctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    console.log(`📊 Found ${allDoctors.length} doctor accounts in the system`)

    // Step 2: Check each doctor email for conflicting patient accounts
    const conflicts = []
    
    for (const doctor of allDoctors) {
      const doctorEmail = doctor.user.email
      
      // Look for ANY user with this email who is NOT the doctor
      const conflictingUsers = await prisma.user.findMany({
        where: {
          email: doctorEmail,
          role: 'PATIENT',
          id: {
            not: doctor.user.id // Exclude the doctor's own user record
          }
        },
        include: {
          patient: true,
          profile: true
        }
      })

      if (conflictingUsers.length > 0) {
        conflicts.push({
          doctorEmail,
          doctorUserId: doctor.user.id,
          conflictingPatientUsers: conflictingUsers
        })
      }
    }

    console.log(`\n🚨 Found ${conflicts.length} email conflicts to resolve:`)
    
    if (conflicts.length === 0) {
      console.log('✅ No conflicts found! All doctor emails are unique.')
      return
    }

    // Step 3: Display conflicts before cleanup
    conflicts.forEach((conflict, index) => {
      console.log(`\n${index + 1}. Email: ${conflict.doctorEmail}`)
      console.log(`   👨‍⚕️ Doctor User ID: ${conflict.doctorUserId}`)
      console.log(`   👤 Conflicting Patient User(s): ${conflict.conflictingPatientUsers.map(u => u.id).join(', ')}`)
    })

    console.log('\n🧹 Starting cleanup process...')

    // Step 4: Remove conflicting patient accounts
    let totalCleaned = 0
    
    for (const conflict of conflicts) {
      console.log(`\n📧 Processing: ${conflict.doctorEmail}`)
      
      for (const patientUser of conflict.conflictingPatientUsers) {
        console.log(`   🗑️  Removing patient account: ${patientUser.id}`)
        
        // Remove in correct order to handle foreign key constraints
        
        // 1. Remove patient record first
        if (patientUser.patient) {
          await prisma.patient.delete({
            where: { id: patientUser.patient.id }
          })
          console.log(`      ✅ Deleted patient record: ${patientUser.patient.id}`)
        }
        
        // 2. Remove user profile
        if (patientUser.profile) {
          await prisma.userProfile.delete({
            where: { userId: patientUser.id }
          })
          console.log(`      ✅ Deleted user profile for: ${patientUser.id}`)
        }
        
        // 3. Remove any appointments (if they exist)
        const appointments = await prisma.appointment.deleteMany({
          where: { patientId: patientUser.patient?.id }
        })
        if (appointments.count > 0) {
          console.log(`      ✅ Deleted ${appointments.count} appointments`)
        }
        
        // 4. Remove the user account itself
        await prisma.user.delete({
          where: { id: patientUser.id }
        })
        console.log(`      ✅ Deleted user account: ${patientUser.id}`)
        
        totalCleaned++
      }
    }

    console.log(`\n🎉 Cleanup completed successfully!`)
    console.log(`📊 Summary:`)
    console.log(`   - ${conflicts.length} email conflicts resolved`)
    console.log(`   - ${totalCleaned} duplicate patient accounts removed`)
    console.log(`   - All doctors now have unique email addresses`)
    
    // Step 5: Verification - check that no conflicts remain
    console.log('\n🔍 Verifying cleanup...')
    const remainingConflicts = []
    
    for (const doctor of allDoctors) {
      const stillConflicting = await prisma.user.findMany({
        where: {
          email: doctor.user.email,
          role: 'PATIENT',
          id: { not: doctor.user.id }
        }
      })
      
      if (stillConflicting.length > 0) {
        remainingConflicts.push(doctor.user.email)
      }
    }
    
    if (remainingConflicts.length === 0) {
      console.log('✅ Verification passed! No remaining conflicts.')
    } else {
      console.log(`❌ Warning: ${remainingConflicts.length} conflicts still remain:`)
      remainingConflicts.forEach(email => console.log(`   - ${email}`))
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupDuplicateAccounts()
    .then(() => {
      console.log('\n🏁 Cleanup script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Cleanup script failed:', error)
      process.exit(1)
    })
}

export { cleanupDuplicateAccounts }