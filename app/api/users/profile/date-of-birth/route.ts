/**
 * User Profile Date of Birth API Endpoint
 * 
 * This API endpoint handles user date of birth updates:
 * - PUT: Update user's date of birth information
 * - Validates date format and ensures reasonable date range
 * - Updates the UserProfile record with new date of birth
 * - Requires user authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * PUT /api/users/profile/date-of-birth
 * 
 * Updates the authenticated user's date of birth information.
 * 
 * @param request - HTTP request containing date of birth data
 * @returns Success message or error response
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
    const { dateOfBirth } = body

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth is required' },
        { status: 400 }
      )
    }

    // Validate date format and range
    const date = new Date(dateOfBirth)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check if date is reasonable (not in future, not too old)
    const now = new Date()
    const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())
    
    if (date > now) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      )
    }
    
    if (date < minAge) {
      return NextResponse.json(
        { error: 'Date of birth is not valid' },
        { status: 400 }
      )
    }

    // Update user's date of birth in UserProfile
    const updatedProfile = await prisma.userProfile.updateMany({
      where: {
        userId: session.user.id,
      },
      data: {
        dateOfBirth: date,
      },
    })

    if (updatedProfile.count === 0) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Date of birth updated successfully' 
    })
  } catch (error) {
    console.error('Error updating date of birth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}