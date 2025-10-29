// File: app/api/pharmacy/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { OrderStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { items, deliveryAddress, deliveryOption, totalAmount, discount } = await request.json()

    // Comprehensive validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.street || !deliveryAddress.city) {
      return NextResponse.json(
        { success: false, error: 'Complete delivery address is required' },
        { status: 400 }
      )
    }

    // Get patient record
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient record not found' },
        { status: 404 }
      )
    }

    // Validate inventory and calculate total
    let calculatedSubtotal = 0
    interface ValidatedItem {
      inventoryId: string
      drugId: string
      pharmacyId: string
      quantity: number
      unitPrice: number
      totalPrice: number
      inventory: {
        id: string
        drugId: string
        pharmacyId: string
        quantity: number
        price: number
        isAvailable: boolean
        drug: { id: string; name: string; description: string | null }
        pharmacy: { id: string; name: string }
      }
    }
    
    const validatedItems: ValidatedItem[] = []

    for (const item of items) {
      const inventory = await prisma.pharmacyInventory.findUnique({
        where: { id: item.inventoryId },
        include: {
          drug: true,
          pharmacy: true
        }
      })

      if (!inventory || !inventory.isAvailable) {
        return NextResponse.json(
          { success: false, error: `Medication ${item.drugId} is currently unavailable` },
          { status: 400 }
        )
      }

      if (inventory.quantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${inventory.drug.name}. Only ${inventory.quantity} units available.` },
          { status: 400 }
        )
      }

      // Price verification with tolerance for minor discrepancies
      if (Math.abs(inventory.price - item.unitPrice) > 0.01) {
        return NextResponse.json(
          { success: false, error: `Price has changed for ${inventory.drug.name}. Please refresh and try again.` },
          { status: 400 }
        )
      }

      const itemTotal = inventory.price * item.quantity
      calculatedSubtotal += itemTotal

      validatedItems.push({
        inventoryId: item.inventoryId,
        drugId: inventory.drugId,
        pharmacyId: inventory.pharmacyId,
        quantity: item.quantity,
        unitPrice: inventory.price,
        totalPrice: itemTotal,
        inventory
      })
    }

    // Calculate delivery fee
    const deliveryOptions = {
      'standard': 2500,
      'express': 5000,
      'same-day': 8000
    }
    const deliveryFee = deliveryOptions[deliveryOption as keyof typeof deliveryOptions] || 2500

    // Apply discount if valid
    let appliedDiscount = 0
    if (discount && discount > 0) {
      appliedDiscount = Math.min(discount, calculatedSubtotal * 0.5) // Max 50% discount
    }

    const calculatedTotal = calculatedSubtotal + deliveryFee - appliedDiscount

    // Verify total amount with tolerance
    if (Math.abs(calculatedTotal - totalAmount) > 1) {
      return NextResponse.json(
        { success: false, error: 'Order total verification failed. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Create comprehensive order transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the primary pharmacy (first pharmacy in the order)
      const mainPharmacy = validatedItems[0].inventory.pharmacy
      
      const order = await tx.drugOrder.create({
        data: {
          patientId: patient.id,
          pharmacyId: mainPharmacy.id,
          status: OrderStatus.PENDING,
          totalAmount: calculatedTotal,
          currency: 'NGN',
          deliveryAddress: JSON.stringify({
            fullName: deliveryAddress.fullName,
            street: deliveryAddress.street,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            postalCode: deliveryAddress.postalCode,
            country: 'Nigeria'
          }),
          deliveryPhone: deliveryAddress.phone,
          deliveryNotes: deliveryAddress.instructions || null
        }
      })

      // Create detailed order items
      for (const item of validatedItems) {
        await tx.drugOrderItem.create({
          data: {
            orderId: order.id,
            drugId: item.drugId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }
        })

        // Update inventory quantities
        await tx.pharmacyInventory.update({
          where: { id: item.inventoryId },
          data: {
            quantity: {
              decrement: item.quantity
            },
            // Mark as unavailable if quantity reaches 0
            isAvailable: item.inventory.quantity - item.quantity > 0
          }
        })
      }

      return order
    })

    // Log comprehensive user activity
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        action: 'ENHANCED_DRUG_ORDER_CREATED',
        details: {
          orderId: result.id,
          orderNumber: `AH-${Date.now().toString().slice(-8)}`,
          totalAmount: calculatedTotal,
          subtotal: calculatedSubtotal,
          deliveryFee: deliveryFee,
          discount: appliedDiscount,
          itemCount: items.length,
          estimatedDelivery: deliveryOption === 'same-day' ? 'Within 6 hours' : 
                           deliveryOption === 'express' ? '1-2 business days' : 
                           '3-5 business days'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully! 🎉',
      data: {
        orderId: result.id,
        orderNumber: `AH-${Date.now().toString().slice(-8)}`,
        status: result.status,
        totalAmount: result.totalAmount,
        deliveryOption: deliveryOption,
        estimatedDelivery: deliveryOption === 'same-day' ? 'Within 6 hours' : 
                          deliveryOption === 'express' ? '1-2 business days' : 
                          '3-5 business days',
        tracking: {
          status: 'Order Confirmed',
          nextUpdate: 'Pharmacy Processing',
          expectedDelivery: new Date(Date.now() + (deliveryOption === 'same-day' ? 6 * 60 * 60 * 1000 : 
                                                   deliveryOption === 'express' ? 2 * 24 * 60 * 60 * 1000 : 
                                                   5 * 24 * 60 * 60 * 1000)).toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error creating enhanced pharmacy order:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process order',
        message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
      },
      { status: 500 }
    )
  }
}

// Get user's pharmacy orders with enhanced details
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Get patient record
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient record not found' },
        { status: 404 }
      )
    }

    // Build comprehensive where clause
    interface WhereClause {
      patientId: string
      status?: OrderStatus
      OR?: Array<{
        deliveryAddress?: { contains: string; mode: 'insensitive' }
        deliveryNotes?: { contains: string; mode: 'insensitive' }
      }>
    }
    
    const whereClause: WhereClause = {
      patientId: patient.id
    }

    if (status && status !== 'ALL') {
      whereClause.status = status as OrderStatus
    }

    if (search) {
      whereClause.OR = [
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
        { deliveryNotes: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get comprehensive orders data
    const orders = await prisma.drugOrder.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            drug: {
              select: {
                id: true,
                name: true,
                brandName: true,
                manufacturer: true,
                strength: true,
                dosageForm: true,
                category: true,
                images: true,
                requiresPrescription: true,
                nafdacNumber: true
              }
            }
          }
        },
        pharmacy: {
          select: {
            id: true,
            name: true,
            phone: true,
            isVerified: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.drugOrder.count({
      where: whereClause
    })

    // Get order statistics
    const orderStats = await prisma.drugOrder.groupBy({
      where: { patientId: patient.id },
      by: ['status'],
      _count: { status: true },
      _sum: { totalAmount: true }
    })

    const statsBreakdown = orderStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = {
        count: stat._count.status,
        totalValue: stat._sum.totalAmount || 0
      }
      return acc
    }, {} as Record<string, { count: number, totalValue: number }>)

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        statistics: {
          totalOrders: totalCount,
          ordersByStatus: statsBreakdown,
          totalSpent: orderStats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0)
        },
        filters: {
          status,
          search,
          availableStatuses: Object.values(OrderStatus)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching enhanced pharmacy orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
