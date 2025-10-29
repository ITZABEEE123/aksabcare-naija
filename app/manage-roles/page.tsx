'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function ManageRolesPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const updateRole = async (newRole: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage(`✅ Role updated to ${newRole}! Please sign out and sign back in.`)
        // Force session update
        await update()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please login first</h1>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Role Management</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">Current User Info:</h3>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Current Role:</strong> <span className="font-mono bg-gray-200 px-2 py-1 rounded">{session.user?.role || 'No role'}</span></p>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-lg bg-gray-100">
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Update Your Role:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => updateRole('PATIENT')}
                disabled={loading}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <div className="text-2xl mb-2">🧑‍⚕️</div>
                <div className="font-semibold">Patient</div>
                <div className="text-sm">Access healthcare services</div>
              </button>

              <button
                onClick={() => updateRole('DOCTOR')}
                disabled={loading}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <div className="text-2xl mb-2">👨‍⚕️</div>
                <div className="font-semibold">Doctor</div>
                <div className="text-sm">Manage patients</div>
              </button>

              <button
                onClick={() => updateRole('SUPER_ADMIN')}
                disabled={loading}
                className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <div className="text-2xl mb-2">👑</div>
                <div className="font-semibold">Super Admin</div>
                <div className="text-sm">Full system access</div>
              </button>
            </div>
          </div>

          <div className="mt-8 flex space-x-3">
            <button
              onClick={() => signOut()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Sign Out & Back In
            </button>
            <a
              href="/debug-user"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Debug User Info
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
