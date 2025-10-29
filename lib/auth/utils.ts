import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import type { Route } from 'next'
import type { NextAuthConfig } from 'next-auth'

// Export authOptions if needed by other parts of the app
export const authOptions: NextAuthConfig = {
  // Your auth configuration here
  providers: [
    // Add your providers
  ],
  callbacks: {
    // Add your callbacks
  },
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth(redirectTo: Route = '/login' as Route) {
  const user = await getCurrentUser()
  if (!user) {
    redirect(redirectTo)
  }
  return user
}

export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: Route = '/unauthorized' as Route
) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect(redirectTo)
  }
  return user
}

export async function requireAdmin() {
  return requireRole([UserRole.SUPER_ADMIN])
}

export async function requireDoctor() {
  return requireRole([UserRole.DOCTOR])
}

export async function requirePatient() {
  return requireRole([UserRole.PATIENT])
}

// Client-side hook for role checking
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
}

export function isDoctor(role: UserRole): boolean {
  return role === UserRole.DOCTOR
}

export function isPatient(role: UserRole): boolean {
  return role === UserRole.PATIENT
}
