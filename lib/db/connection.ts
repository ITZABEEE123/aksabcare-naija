import { prisma } from './prisma'

export async function connectToDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to database')
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Database connection failed:', error.message)
    } else {
      console.error('❌ An unknown error occurred during database connection.')
    }
    return false
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Disconnected from database')
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Database disconnection failed:', error.message)
    } else {
      console.error('❌ An unknown error occurred during database disconnection.')
    }
  }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date() }
  } catch (error) {
    // We check if the error is an instance of Error to safely access its message property.
    if (error instanceof Error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date() }
    }
    
    // Fallback for cases where the error is not a standard Error object.
    const errorMessage = typeof error === 'string'? error : 'An unknown error occurred.';
    return { status: 'unhealthy', error: errorMessage, timestamp: new Date() }
  }
}