// File: app/api/pharmacy/seed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { seedPharmacyData } from '@/prisma/pharmacy-seed'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting enhanced pharmacy database seeding...')
    
    // Check if pharmacy data already exists
    const existingDrugCount = await prisma.drug.count()
    const existingPharmacyCount = await prisma.pharmacy.count()
    
    if (existingDrugCount > 0 || existingPharmacyCount > 0) {
      console.log('⚠️ Pharmacy data already exists. Skipping seeding.')
      return NextResponse.json({
        success: true,
        message: 'Pharmacy data already exists',
        data: {
          drugsInDatabase: existingDrugCount,
          pharmaciesInDatabase: existingPharmacyCount,
          alreadySeeded: true
        }
      })
    }
    
    // Run the enhanced seeding function
    const result = await seedPharmacyData()
    
    console.log('✅ Enhanced pharmacy database seeding completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced pharmacy data seeded successfully! 🎉',
      data: {
        pharmacy: result.pharmacy.name,
        drugsCreated: result.drugsCount,
        inventoryRecords: result.inventoryCount,
        categories: [
          'ANTIBIOTIC (15 drugs)',
          'ANALGESIC (12 drugs)', 
          'ANTIHYPERTENSIVE (8 drugs)',
          'ANTIDIABETIC (6 drugs)',
          'ANTIMALARIAL (5 drugs)',
          'VITAMIN (10 drugs)',
          'CARDIOVASCULAR (5 drugs)',
          'RESPIRATORY (5 drugs)'
        ],
        features: [
          '✅ 60+ Real Nigerian Medications',
          '✅ NAFDAC Verification Numbers',
          '✅ Complete Drug Information',
          '✅ Multiple Pharmacy Pricing',
          '✅ Prescription Requirements',
          '✅ Stock Management',
          '✅ Category Classification',
          '✅ Search & Filter Ready'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error seeding enhanced pharmacy data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed enhanced pharmacy data',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check database connection and schema'
      },
      { status: 500 }
    )
  }
}

// Get enhanced seeding status and statistics
export async function GET() {
  try {
    // Get comprehensive statistics
    const [
      drugCount,
      pharmacyCount, 
      inventoryCount,
      categoryStats,
      prescriptionStats,
      priceStats
    ] = await Promise.all([
      prisma.drug.count(),
      prisma.pharmacy.count(),
      prisma.pharmacyInventory.count(),
      prisma.drug.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.drug.groupBy({
        by: ['requiresPrescription'],
        _count: { requiresPrescription: true }
      }),
      prisma.pharmacyInventory.aggregate({
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
        _sum: { quantity: true }
      })
    ])

    const categoryBreakdown = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = stat._count.category
      return acc
    }, {} as Record<string, number>)

    const prescriptionBreakdown = prescriptionStats.reduce((acc, stat) => {
      acc[stat.requiresPrescription ? 'prescription' : 'otc'] = stat._count.requiresPrescription
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          drugsInDatabase: drugCount,
          pharmaciesInDatabase: pharmacyCount,
          inventoryRecords: inventoryCount,
          totalStock: priceStats._sum.quantity || 0,
          isSeeded: drugCount > 0 && pharmacyCount > 0
        },
        categories: categoryBreakdown,
        prescriptionStats: {
          prescriptionRequired: prescriptionBreakdown.prescription || 0,
          overTheCounter: prescriptionBreakdown.otc || 0
        },
        priceAnalysis: {
          averagePrice: priceStats._avg.price || 0,
          lowestPrice: priceStats._min.price || 0,
          highestPrice: priceStats._max.price || 0,
          currency: 'NGN'
        },
        status: drugCount > 0 ? 'SEEDED' : 'NOT_SEEDED',
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error checking enhanced seeding status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check enhanced seeding status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
