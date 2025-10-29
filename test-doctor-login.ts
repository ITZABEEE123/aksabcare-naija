// 🧪 QUICK LOGIN TEST FOR NEW DOCTORS
// ==================================
// Test script to verify doctor login credentials work correctly

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testDoctorLogin() {
  console.log('🧪 Testing Doctor Login Credentials...\n')
  
  try {
    // Test a few different doctors
    const testEmails = [
      'fatibellow@gmail.com',        // Dr. Fatima H. Bello
      'joyprazole2@gmail.com',       // Dr. Sururat Ibrahim
      'bajogumbi@yahoo.com',         // Dr. Hauwa Sanusi Gumbi
      'drokor1976@gmail.com'         // Dr. Douglas Emeka
    ]
    
    const testPassword = '123456789'
    
    for (const email of testEmails) {
      console.log(`Testing login for: ${email}`)
      
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          doctor: true
        }
      })
      
      if (!user) {
        console.log(`   ❌ User not found`)
        continue
      }
      
      const passwordValid = await bcrypt.compare(testPassword, user.password)
      
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   👤 Name: ${user.profile?.firstName} ${user.profile?.lastName}`)
      console.log(`   🏥 Specialization: ${user.doctor?.specialization}`)
      console.log(`   🔐 Password Valid: ${passwordValid ? '✅ YES' : '❌ NO'}`)
      console.log(`   ✅ Active: ${user.isActive ? 'YES' : 'NO'}`)
      console.log(`   ✅ Verified: ${user.isVerified ? 'YES' : 'NO'}`)
      console.log(`   ✅ Available: ${user.doctor?.isAvailable ? 'YES' : 'NO'}`)
      console.log(`   💰 Fee: ₦${user.doctor?.consultationFee?.toLocaleString()}`)
      console.log(`   🌍 Country: ${user.doctor?.country}`)
      console.log('   ─────────────────────────────────────────\n')
    }
    
    // Get total count
    const totalDoctors = await prisma.doctor.count()
    const availableDoctors = await prisma.doctor.count({
      where: { 
        isAvailable: true,
        user: {
          isActive: true,
          isVerified: true
        }
      }
    })
    
    console.log('📊 SUMMARY:')
    console.log(`   Total Doctors: ${totalDoctors}`)
    console.log(`   Available Doctors: ${availableDoctors}`)
    console.log(`   Password for all: 123456789`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDoctorLogin()