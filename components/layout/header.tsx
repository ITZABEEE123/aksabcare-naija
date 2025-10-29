'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { data: session } = useSession()

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800'
      case 'DOCTOR':
        return 'bg-blue-100 text-blue-800'
      case 'PATIENT':
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {session?.user?.role && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(session.user.role as UserRole)}`}>
                {session.user.role.replace('_', ' ')}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {getGreeting()}, {session?.user?.name}! Welcome back to AksabHealth.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {children}

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <span className="text-lg">🔔</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <span className="text-lg">❓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}