'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { User } from 'next-auth'

// CORRECTED: More specific type for the session user
interface UserSession extends User {
  doctorId?: string
}

interface DashboardData {
  upcomingAppointments: Array<{
    id: string
    patientId: string
    scheduledDate: string
    type: string
    status: string
    notes?: string
    meetingLink?: string
    patient: {
      user: {
        profile: {
          firstName: string
          lastName: string
        }
      }
    }
  }>
  recentAppointments: Array<{
    id: string
    scheduledDate: string
    completedAt: string
    type: string
    status: string
    patient: {
      user: {
        profile: {
          firstName: string
          lastName: string
        }
      }
    }
  }>
  monthlyStats: {
    scheduled: number
    completed: number
    cancelled: number
    total: number
  }
  reviews: Array<{
    id: string
    rating: number
    comment: string
    createdAt: string
    patient: {
      user: {
        profile: {
          firstName: string
          lastName: string
        }
      }
    }
  }>
  earnings: {
    thisMonth: number
    appointments: number
  }
}

interface Doctor {
  id: string
  specialization: string
  experience: number
  consultationFee: number
  rating: number
  totalConsultations: number
  user: {
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
  }
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // CORRECTED: Improved fetch function with better error handling
  const fetchDashboardData = useCallback(async () => {
    const user = session?.user as UserSession
    
    // CORRECTED: Set loading to false if no doctorId and show error
    if (!user?.doctorId) {
      setError('No doctor ID found in session')
      setLoading(false)
      return
    }

    try {
      setError(null) // Clear any previous errors
      
      const [dashboardResponse, profileResponse] = await Promise.all([
        fetch(`/api/doctors/dashboard/${user.doctorId}`),
        fetch(`/api/doctors/${user.doctorId}`)
      ])

      // CORRECTED: Check if responses are ok
      if (!dashboardResponse.ok || !profileResponse.ok) {
        throw new Error('Failed to fetch data from server')
      }

      const [dashboardData, profileData] = await Promise.all([
        dashboardResponse.json(),
        profileResponse.json()
      ])

      setDashboardData(dashboardData)
      setDoctorProfile(profileData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  // CORRECTED: Better useEffect with status check
  useEffect(() => {
    if (status === 'loading') {
      return // Still loading session
    }
    
    if (status === 'unauthenticated') {
      setError('Please log in to access the dashboard')
      setLoading(false)
      return
    }
    
    if (status === 'authenticated' && session?.user) {
      fetchDashboardData()
    }
  }, [status, session, fetchDashboardData])

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
        })
      })

      if (response.ok) {
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const handleChatWithPatient = (patientId: string) => {
    router.push(`/doctor/chat/${patientId}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // CORRECTED: Better loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // CORRECTED: Error state handling
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchDashboardData()
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <motion.div
        className="bg-white shadow-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {doctorProfile?.user.profile.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                {doctorProfile?.specialization} • {doctorProfile?.experience} years experience
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/doctor/reminders')}
              >
                <BellIcon className="w-6 h-6" />
              </motion.button>
              <motion.button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/doctor/settings')}
              >
                <CogIcon className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.monthlyStats.total || 0}
                </p>
                <p className="text-sm text-green-600">Appointments</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.monthlyStats.completed || 0}
                </p>
                <p className="text-sm text-green-600">This month</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.earnings.thisMonth || 0)}
                </p>
                <p className="text-sm text-green-600">This month</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {doctorProfile?.rating.toFixed(1) || '0.0'}
                  </p>
                  <StarSolid className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-600">{doctorProfile?.totalConsultations} reviews</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'appointments', label: 'Appointments', icon: CalendarIcon },
              { key: 'patients', label: 'Patients', icon: UserGroupIcon },
              { key: 'reviews', label: 'Reviews', icon: StarIcon }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                whileHover={{ y: -2 }}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {dashboardData?.upcomingAppointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
                  ) : (
                    dashboardData?.upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                            <VideoCameraIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {appointment.patient.user.profile.firstName} {appointment.patient.user.profile.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.scheduledDate).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })} at{' '}
                              {new Date(appointment.scheduledDate).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })}
                            </p>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {appointment.status === 'SCHEDULED' && (
                            <>
                              <motion.button
                                onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </motion.button>
                            </>
                          )}
                          {appointment.meetingLink && (
                            <motion.a
                              href={appointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <VideoCameraIcon className="w-5 h-5" />
                            </motion.a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
                </div>
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {dashboardData?.reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reviews yet</p>
                  ) : (
                    dashboardData?.reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {review.patient.user.profile.firstName} {review.patient.user.profile.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {Array(5).fill(0).map((_, i) => (
                              <StarSolid
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Block Time</span>
                  </motion.button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData?.upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.patient.user.profile.firstName} {appointment.patient.user.profile.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.scheduledDate).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' })} at{' '}
                            {new Date(appointment.scheduledDate).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: true })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {appointment.type} • {appointment.notes && `"${appointment.notes.substring(0, 50)}..."`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <div className="flex items-center space-x-1">
                          {appointment.status === 'SCHEDULED' && (
                            <>
                              <motion.button
                                onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Confirm"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Cancel"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </motion.button>
                            </>
                          )}
                          {appointment.meetingLink && (
                            <motion.a
                              href={appointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Join Meeting"
                            >
                              <VideoCameraIcon className="w-5 h-5" />
                            </motion.a>
                          )}
                          <motion.button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Send Message"
                            onClick={() => handleChatWithPatient(appointment.patientId)}
                          >
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}