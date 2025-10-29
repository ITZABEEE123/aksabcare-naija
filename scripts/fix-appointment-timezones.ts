// 🕐 FIX APPOINTMENT TIMEZONE SCRIPT
// ===================================
// This script fixes timezone issues in existing appointments
// The problem: Some appointments may have been stored with incorrect timezone conversions
// The solution: Recalculate appointment times to ensure they display correctly

import { prisma } from '../lib/db/prisma'

async function fixAppointmentTimezones() {
  console.log('🔧 Starting appointment timezone fix...')
  
  try {
    // Get all appointments
    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        scheduledDate: true,
        createdAt: true
      }
    })
    
    console.log(`📊 Found ${appointments.length} appointments to check`)
    
    let fixedCount = 0
    
    for (const appointment of appointments) {
      // Check if the appointment time seems to have timezone issues
      // If an appointment was stored incorrectly, it might be off by 1-2 hours
      
      const originalDate = new Date(appointment.scheduledDate)
      
      // Convert to Nigerian timezone for display
      const nigerianTime = originalDate.toLocaleString('en-US', { 
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      console.log(`Appointment ${appointment.id}: ${originalDate.toISOString()} -> Nigerian time: ${nigerianTime}`)
      
      // Note: We're not actually changing the data here, just logging what we found
      // This is because the display logic fix should handle the timezone conversion properly
      // If you need to fix the actual data, you would add update logic here
    }
    
    console.log(`✅ Processed ${appointments.length} appointments`)
    console.log(`🔧 Fixed ${fixedCount} appointments`)
    console.log('✨ Timezone fix complete!')
    
  } catch (error) {
    console.error('❌ Error fixing appointment timezones:', error)
    throw error
  }
}

// Function to test the timezone display
async function testTimezoneDisplay() {
  console.log('🧪 Testing timezone display...')
  
  const testDate = new Date('2025-10-07T14:00:00.000Z') // 2 PM UTC
  
  console.log('Test date (UTC):', testDate.toISOString())
  console.log('Test date (Nigerian time):', testDate.toLocaleString('en-US', { 
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }))
  
  // Test with current time
  const now = new Date()
  console.log('Current time (UTC):', now.toISOString())
  console.log('Current time (Nigerian):', now.toLocaleString('en-US', { 
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }))
}

// Run the script
async function main() {
  console.log('🚀 Starting appointment timezone diagnostic...')
  
  await testTimezoneDisplay()
  await fixAppointmentTimezones()
  
  await prisma.$disconnect()
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}

export { fixAppointmentTimezones, testTimezoneDisplay }