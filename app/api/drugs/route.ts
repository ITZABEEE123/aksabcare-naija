import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    console.log('Simple drugs API called')
    
    const drugs = await prisma.drug.findMany({
      include: {
        pharmacyInventory: {
          where: {
            isAvailable: true,
            quantity: {
              gt: 0
            }
          },
          include: {
            pharmacy: {
              include: {
                address: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to match the frontend expectations
    const transformedDrugs = drugs.map(drug => ({
      ...drug,
      pharmacies: drug.pharmacyInventory.map(inventory => ({
        id: inventory.pharmacy.id,
        name: inventory.pharmacy.name,
        isVerified: inventory.pharmacy.isVerified || false,
        phone: inventory.pharmacy.phone || '',
        address: inventory.pharmacy.address ? {
          street: inventory.pharmacy.address.street,
          city: inventory.pharmacy.address.city,
          state: inventory.pharmacy.address.state
        } : undefined,
        quantity: inventory.quantity,
        price: inventory.price,
        batchNumber: inventory.batchNumber || 'N/A',
        expiryDate: inventory.expiryDate || new Date().toISOString(),
        inventoryId: inventory.id
      }))
    }))

    console.log('Found ' + transformedDrugs.length + ' drugs with pharmacy data')

    return NextResponse.json(transformedDrugs)
  } catch (error) {
    console.error('Error in drugs API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drugs' },
      { status: 500 }
    )
  }
}
