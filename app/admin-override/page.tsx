'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function AdminOverridePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const updateRoleDirectly = async (role: string) => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage(`✅ Role updated to ${role}! Signing you out...`)
        // Sign out and redirect to login
        setTimeout(() => {
          signOut({ callbackUrl: '/login' })
        }, 2000)
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const loginAs = async (role: string) => {
    setLoading(true)
    try {
      // Login with default credentials
      const result = await signIn('credentials', {
        email: 'itzofficialabeee@gmail.com', // Use your registered email
        password: '123456789', // Use your password
        redirect: false
      })

      if (result?.ok) {
        // Then update role
        await updateRoleDirectly(role)
      } else {
        setMessage('❌ Login failed. Please check credentials.')
      }
    } catch (error) {
      setMessage('❌ Login process failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">🔧 Admin Override Panel</h1>
          
          {session ? (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ You are logged in!</h3>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Current Role:</strong> {session.user?.role || 'No role'}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Change Your Role:</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => updateRoleDirectly('PATIENT')}
                    disabled={loading}
                    className="bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    🧑‍⚕️ Become PATIENT
                  </button>
                  
                  <button
                    onClick={() => updateRoleDirectly('DOCTOR')}
                    disabled={loading}
                    className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    👨‍⚕️ Become DOCTOR
                  </button>
                  
                  <button
                    onClick={() => updateRoleDirectly('SUPER_ADMIN')}
                    disabled={loading}
                    className="bg-red-600 text-white p-3 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    👑 Become SUPER_ADMIN
                  </button>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">❌ You are not logged in</h3>
                <p>Please login first, then come back here to change your role.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Login & Role Setup:</h3>
                <p className="text-sm text-gray-600">Update your credentials below, then click:</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => loginAs('PATIENT')}
                    disabled={loading}
                    className="bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Login as PATIENT
                  </button>
                  
                  <button
                    onClick={() => loginAs('DOCTOR')}
                    disabled={loading}
                    className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Login as DOCTOR
                  </button>
                  
                  <button
                    onClick={() => loginAs('SUPER_ADMIN')}
                    disabled={loading}
                    className="bg-red-600 text-white p-3 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Login as SUPER_ADMIN
                  </button>
                </div>

                <div className="mt-4">
                  <a href="/login" className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                    Or Go to Regular Login
                  </a>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">{message}</p>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
