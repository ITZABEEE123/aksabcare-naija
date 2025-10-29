/**
 * MASTER SEED FILE
 * ================
 * This file coordinates the execution of all seed files in the correct order.
 * It ensures all database tables are populated with comprehensive test data.
 * 
 * Execution Order:
 * 1. Main seed (admin users + hospitals)
 * 2. Doctor seed (doctor users + profiles)
 * 3. Pharmacy seed (pharmacies + drugs + inventory)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMainSeed() {
  console.log('🏥 Running main seed (admin + hospitals)...')
  
  // Import and run the main seed
  const { main: mainSeed } = await import('./seed')
  await mainSeed()
  
  console.log('✅ Main seed completed')
}

async function runDoctorSeed() {
  console.log('👨‍⚕️ Running doctor seed...')
  
  try {
    // Import and run the doctor seed
    const { main: doctorSeed } = await import('./seed-doctors')
    await doctorSeed()
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
      console.log('⚠️  Some doctors already exist, continuing...')
    } else {
      throw error
    }
  }
  
  console.log('✅ Doctor seed completed')
}

async function runPharmacySeed() {
  console.log('💊 Running pharmacy seed...')
  
  // Import and run the pharmacy seed (uses main function)
  const { main: pharmacySeed } = await import('./pharmacy-seed')
  await pharmacySeed()
  
  console.log('✅ Pharmacy seed completed')
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')
  console.log('================================================')
  
  try {
    // Run seeds in order
    await runMainSeed()
    await runDoctorSeed()
    await runPharmacySeed()
    
    console.log('================================================')
    console.log('🎉 All seeding completed successfully!')
    console.log('Database now contains:')
    console.log('  - Admin users')
    console.log('  - Hospitals with services and addresses')
    console.log('  - Doctors with profiles and specializations')
    console.log('  - Pharmacies with drug inventory')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Export main function for programmatic use
export { main }

// Auto-execute if run directly
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
      console.log('Database connection closed')
    })
    .catch(async (e) => {
      console.error('❌ Master seeding failed:', e)
      await prisma.$disconnect()
      process.exit(1)
    })
}