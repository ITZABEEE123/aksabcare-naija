/**
 * User Account Deletion API Endpoint
 * 
 * This API endpoint handles permanent account deletion:
 * - DELETE: Permanently delete user account and all associated data
 * - Cascades deletion to related records (profile, addresses, etc.)
 * - Requires user authentication via NextAuth session
 * - Irreversible action with complete data removal
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * DELETE /api/users/delete
 * 
 * Permanently deletes the authenticated user's account and all associated data.
 * This action is irreversible and will remove:
 * - User account record
 * - User profile information
 * - Address information
 * - All related data (cascaded by foreign key relationships)
 * 
 * @returns Success message or error response
 */
export async function DELETE() {
  try {
    // Verify user authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete user account - this will cascade to related records
    // The database schema should have ON DELETE CASCADE set up
    // for UserProfile, Address, and other related tables
    const deletedUser = await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    })

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user account:', error)
    
    // Check if this is a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: 'Unable to delete account due to existing data dependencies' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}