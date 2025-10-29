/**
 * Debug API Route to check hospital data
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Get all hospitals with their addresses
    const hospitals = await prisma.hospital.findMany({
      include: {
        address: true,
      },
      take: 5 // Just first 5 for debugging
    })

    // Get count of all hospitals
    const totalCount = await prisma.hospital.count()

    // Get count of verified hospitals
    const verifiedCount = await prisma.hospital.count({
      where: { isVerified: true }
    })

    return NextResponse.json({
      totalHospitals: totalCount,
      verifiedHospitals: verifiedCount,
      sampleHospitals: hospitals,
      message: `Found ${totalCount} total hospitals, ${verifiedCount} verified`
    })

  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospital data', details: error },
      { status: 500 }
    )
  }
}