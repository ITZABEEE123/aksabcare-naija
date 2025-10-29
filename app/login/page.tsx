'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'PATIENT',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams?.get('error')

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    console.log('🔑 Attempting login with:', {
      email: formData.email,
      role: formData.role,


      
    })

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        redirect: false,
      })

      console.log('📡 signIn result:', result)

      if (result?.error) {
        console.warn('❌ Login failed:', result.error)
        setErrors({ submit: 'Invalid email or password' })
      } else if (result?.url) {
        console.log('✅ Login success. Redirecting to:', '/dashboard')
        router.push('/dashboard' as Route)
      } else {
        console.warn('⚠️ Login result has no error but also no URL:', result)
      }
    } catch (error) {
      console.error('💥 Login submission error:', error)
      setErrors({ submit: 'An error occurred during login' })
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-black mt-2">Sign in to access your healthcare dashboard</p>
          </div>

          {authError === 'unauthorized' && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              You don&apos;t have permission to access that resource.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Login As</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="PATIENT">🧑‍⚕️ Patient - Access healthcare services</option>
                <option value="DOCTOR">👨‍⚕️ Doctor - Manage patients and consultations</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Google OAuth for Patients Only */}
            {formData.role === 'PATIENT' && (
              <>
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
                  <span>Sign in with Google</span>
                </button>
              </>
            )}

            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <Link href={'/auth/forgot-password' as Route} className="text-sm text-blue-600 hover:text-blue-800">
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="text-center mt-8">
            <p className="text-black">
              Don&apos;t have an account?{' '}
              <Link href={'/register' as Route} className="text-blue-600 hover:text-blue-800 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
