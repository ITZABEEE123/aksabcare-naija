'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import type { Route } from 'next' // 1. Import Route for type assertions

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'PATIENT' // Always PATIENT - doctors sign in through login page
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 2. FIX: Corrected API endpoint path
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // 3. FIX: Add 'as Route' to satisfy Typed Routes
        router.push('/login?message=Registration successful' as Route)
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      // 4. FIX: Use the 'error' variable for debugging
      console.error("Registration submission error:", error)
      setError('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🏥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Join AksabCare</h1>
            <p className="text-black mt-2">Create your patient account to access quality healthcare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+234 801 234 5678"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Remove role selection - patients only */}
            <input type="hidden" name="role" value="PATIENT" />

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/patient' })}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-black">
              Already have an account?{' '}
              {/* 3. FIX: Add 'as Route' to satisfy Typed Routes */}
              <Link href={'/login' as Route} className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
              </Link>
            </p>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Healthcare Professionals:</strong> If you&apos;re a doctor or medical professional, 
                please <Link href={'/login' as Route} className="text-blue-600 hover:text-blue-800 font-medium underline">
                  sign in here
                </Link> with your existing credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

