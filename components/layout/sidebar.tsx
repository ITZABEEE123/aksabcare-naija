'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import type { Route } from 'next' // 1. Import Route for type assertions

interface MenuItem {
  name: string
  href: string
  icon: string
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    roles: ['PATIENT', 'DOCTOR', 'SUPER_ADMIN']
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: '📅',
    roles: ['PATIENT', 'DOCTOR']
  },
  {
    name: 'Medical Records',
    href: '/medical-records',
    icon: '📋',
    roles: ['PATIENT', 'DOCTOR']
  },
  {
    name: 'Doctors',
    href: '/doctors',
    icon: '👨‍⚕️',
    roles: ['PATIENT']
  },
  {
    name: 'Hospitals',
    href: '/hospitals',
    icon: '🏥',
    roles: ['PATIENT', 'SUPER_ADMIN']
  },
  {
    name: 'Patients',
    href: '/doctor/patients',
    icon: '🧑‍🤝‍🧑',
    roles: ['DOCTOR']
  },
  {
    name: 'Consultations',
    href: '/doctor/consultations',
    icon: '💬',
    roles: ['DOCTOR']
  },
  {
    name: 'Pharmacy',
    href: '/pharmacy',
    icon: '💊',
    roles: ['PATIENT']
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: '👥',
    roles: ['SUPER_ADMIN']
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: '⚙️',
    roles: ['SUPER_ADMIN']
  }
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const userRole = session?.user?.role as UserRole

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole)
  )

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 relative"> {/* Added relative positioning */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">AksabCare</h1>
              <p className="text-xs text-gray-500">Healthcare Platform</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="text-xs">{isCollapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              // 2. FIX: Add 'as Route' to satisfy Typed Routes
              href={item.href as Route}
              className={`
                flex items-center px-3 py-2 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            {/* 3. FIX: Correctly get the first initial of the user's name */}
            <span className="text-sm font-semibold">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userRole?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full mt-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left flex items-center"
          >
            <span className="mr-2">🚪</span> Sign Out
          </button>
        )}
      </div>
    </div>
  )
}
