/**
 * User Profile Address API Endpoint
 * 
 * This API endpoint handles user address information updates:
 * - PUT: Update user's address information
 * - Validates address data before saving to database
 * - Creates new address record or updates existing one
 * - Requires user authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * Address validation schema
 * Defines required and optional fields for address data
 */
interface AddressData {
  street: string
  city: string
  state: string
  country: string
  postalCode?: string
}

/**
 * PUT /api/users/profile/address
 * 
 * Updates the authenticated user's address information.
 * Creates a new address record if none exists, or updates the existing one.
 * 
 * @param request - HTTP request containing address data
 * @returns Updated user profile with new address information
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const addressData: AddressData = {
      street: body.street?.trim(),
      city: body.city?.trim(),
      state: body.state?.trim(),
      country: body.country?.trim() || 'Nigeria',
      postalCode: body.postalCode?.trim() || undefined,
    }

    // Validate required fields
    if (!addressData.street || !addressData.city || !addressData.state) {
      return NextResponse.json(
        { error: 'Street, city, and state are required' },
        { status: 400 }
      )
    }

    // Get user's profile ID
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        profile: {
          select: {
            id: true,
            address: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!userProfile?.profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Update or create address
    if (userProfile.profile.address) {
      // Update existing address
      await prisma.address.update({
        where: { id: userProfile.profile.address.id },
        data: addressData,
      })
    } else {
      // Create new address and link to user profile
      await prisma.address.create({
        data: {
          ...addressData,
          userProfileId: userProfile.profile.id,
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Address updated successfully' 
    })
  } catch (error) {
    console.error('Error updating user address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}