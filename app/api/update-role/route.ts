import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'
import { checkAccountConflict } from '@/lib/utils/account-validation'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { role } = await request.json()
    
    // Validate role
    const validRoles = ['PATIENT', 'DOCTOR', 'SUPER_ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 🏥 HEALTHCARE SECURITY CHECK: Prevent role switching conflicts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only check conflicts for DOCTOR and PATIENT roles
    if (role === 'DOCTOR' || role === 'PATIENT') {
      const conflictCheck = await checkAccountConflict(user.email, role, session.user.id);
      
      if (conflictCheck.hasConflict) {
        return NextResponse.json({ 
          error: conflictCheck.message,
          code: conflictCheck.conflictType 
        }, { status: 403 })
      }
    }

    // Update user role in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: role }
    })

    return NextResponse.json({ 
      message: 'Role updated successfully', 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
    
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
