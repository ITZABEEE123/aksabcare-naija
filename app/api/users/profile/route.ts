/**
 * User Profile API Endpoint
 * 
 * This API endpoint handles user profile data operations including:
 * - GET: Retrieve comprehensive user profile information
 * - Includes personal details, contact information, and address data
 * - Requires user authentication via NextAuth session
 * - Returns structured profile data for the frontend profile page
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/users/profile
 * 
 * Retrieves the authenticated user's complete profile information.
 * This includes user details, contact information, and address data
 * from the UserProfile and Address models.
 * 
 * @returns {Object} Complete user profile data including:
 *   - id: User unique identifier
 *   - firstName: User's first name
 *   - lastName: User's last name
 *   - email: User's email address
 *   - phone: User's phone number (optional)
 *   - dateOfBirth: User's date of birth (optional)
 *   - address: Complete address information (optional)
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch comprehensive user profile data
    // Includes UserProfile and Address relations for complete information
    const userProfile = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            address: {
              select: {
                id: true,
                street: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
              },
            },
          },
        },
      },
    })

    // Handle case where user profile is not found
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Handle case where UserProfile record doesn't exist
    if (!userProfile.profile) {
      return NextResponse.json(
        { error: 'Profile data not found' },
        { status: 404 }
      )
    }

    // Structure response data for frontend consumption
    const profileData = {
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.profile.firstName,
      lastName: userProfile.profile.lastName,
      phone: userProfile.profile.phone,
      dateOfBirth: userProfile.profile.dateOfBirth,
      address: userProfile.profile.address,
      createdAt: userProfile.createdAt,
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}