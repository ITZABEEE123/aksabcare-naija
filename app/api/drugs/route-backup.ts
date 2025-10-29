// File: app/api/drugs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { Prisma, DrugCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const requiresPrescription = searchParams.get('requiresPrescription')

    // Build where clause
    const whereClause: Prisma.DrugWhereInput = {}

    // Advanced search functionality
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { activeIngredients: { hasSome: [search] } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Category filter
    if (category && category !== 'ALL') {
      whereClause.category = category as DrugCategory
    }

    // Prescription filter
    if (requiresPrescription !== null && requiresPrescription !== '') {
      whereClause.requiresPrescription = requiresPrescription === 'true'
    }

    // Include pharmacy inventory for price filtering
    const inventoryWhere: Prisma.PharmacyInventoryWhereInput = {
      isAvailable: true,
      quantity: { gt: 0 }
    }
    
    if (minPrice || maxPrice) {
      inventoryWhere.price = {}
      if (minPrice) inventoryWhere.price.gte = parseFloat(minPrice)
      if (maxPrice) inventoryWhere.price.lte = parseFloat(maxPrice)
    }

    // Get drugs with inventory
    const drugs = await prisma.drug.findMany({
      where: {
        ...whereClause,
        pharmacyInventory: {
          some: inventoryWhere
        }
      },
      include: {
        pharmacyInventory: {
          where: inventoryWhere,
          select: {
            id: true,
            pharmacyId: true,
            quantity: true,
            price: true,
            currency: true,
            expiryDate: true,
            batchNumber: true,
            pharmacy: {
              select: {
                id: true,
                name: true,
                isVerified: true,
                phone: true,
                address: true
              }
            }
          },
          orderBy: {
            price: 'asc' // Show cheapest first
          }
        }
      },
      orderBy: sortBy === 'price' 
        ? [{ name: 'asc' }] // Default to name sorting when price is requested
        : { [sortBy]: sortOrder as 'asc' | 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.drug.count({
      where: {
        ...whereClause,
        pharmacyInventory: {
          some: inventoryWhere
        }
      }
    })

    // Transform data for frontend
    const transformedDrugs = drugs.map(drug => ({
      id: drug.id,
      name: drug.name,
      genericName: drug.genericName,
      brandName: drug.brandName,
      manufacturer: drug.manufacturer,
      nafdacNumber: drug.nafdacNumber,
      category: drug.category,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      activeIngredients: drug.activeIngredients,
      requiresPrescription: drug.requiresPrescription,
      isControlled: drug.isControlled,
      description: drug.description,
      sideEffects: drug.sideEffects,
      contraindications: drug.contraindications,
      images: drug.images,
      // Get the lowest price from available inventory
      price: Math.min(...drug.pharmacyInventory.map(inv => inv.price)),
      currency: drug.pharmacyInventory[0]?.currency || 'NGN',
      availableQuantity: drug.pharmacyInventory.reduce((sum, inv) => sum + inv.quantity, 0),
      pharmacies: drug.pharmacyInventory.map(inv => ({
        inventoryId: inv.id,
        pharmacyId: inv.pharmacyId,
        pharmacyName: inv.pharmacy.name,
        isVerified: inv.pharmacy.isVerified,
        price: inv.price,
        quantity: inv.quantity,
        currency: inv.currency,
        expiryDate: inv.expiryDate,
        batchNumber: inv.batchNumber,
        phone: inv.pharmacy.phone,
        address: inv.pharmacy.address
      }))
    }))

    // Get categories for filter
    const categories = await prisma.drug.findMany({
      select: { category: true },
      distinct: ['category']
    })

    const response = {
      success: true,
      data: {
        drugs: transformedDrugs,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        categories: categories.map(c => c.category),
        filters: {
          search,
          category,
          sortBy,
          sortOrder,
          minPrice,
          maxPrice,
          requiresPrescription
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching drugs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch drugs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get drug details by ID
export async function POST(request: NextRequest) {
  try {
    const { drugId } = await request.json()

    if (!drugId) {
      return NextResponse.json(
        { success: false, error: 'Drug ID is required' },
        { status: 400 }
      )
    }

    const drug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        pharmacyInventory: {
          where: {
            isAvailable: true,
            quantity: { gt: 0 }
          },
          include: {
            pharmacy: {
              select: {
                id: true,
                name: true,
                phone: true,
                isVerified: true,
                address: true,
                operatingHours: true
              }
            }
          }
        }
      }
    })

    if (!drug) {
      return NextResponse.json(
        { success: false, error: 'Drug not found' },
        { status: 404 }
      )
    }

    const transformedDrug = {
      ...drug,
      lowestPrice: Math.min(...drug.pharmacyInventory.map(inv => inv.price)),
      totalQuantity: drug.pharmacyInventory.reduce((sum, inv) => sum + inv.quantity, 0),
      availableAt: drug.pharmacyInventory.length,
      pharmacies: drug.pharmacyInventory.map(inv => ({
        inventoryId: inv.id,
        pharmacy: inv.pharmacy,
        price: inv.price,
        quantity: inv.quantity,
        currency: inv.currency,
        expiryDate: inv.expiryDate,
        batchNumber: inv.batchNumber
      }))
    }

    return NextResponse.json({
      success: true,
      data: transformedDrug
    })

  } catch (error) {
    console.error('Error fetching drug details:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch drug details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
