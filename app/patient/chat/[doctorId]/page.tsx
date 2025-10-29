'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import Chat from '@/components/chat'
import VideoCall from '@/components/videocall'
import Image from 'next/image'

interface Doctor {
  id: string
  specialization: string
  user: {
    profile: {
      firstName: string
      lastName: string
      avatar: string | null
    }
  }
}

interface Appointment {
  id: string
  scheduledDate: Date
  status: string
  doctor: Doctor | null
}

interface AccessInfo {
  hasAccess: boolean
  appointmentId?: string
  appointmentStatus?: string
  scheduledDate?: string
  timing?: {
    isUpcoming: boolean
    isCurrent: boolean
    isPast: boolean
    message: string
  }
  message?: string
}

export default function PatientChatPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const doctorId = params?.doctorId as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat')
  const [hasAccess, setHasAccess] = useState(false)
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null)

  useEffect(() => {
    if (!session?.user || !doctorId) return

    const checkAccessAndFetchData = async () => {
      setLoading(true)
      try {
        // Check if user has access to chat with this doctor
        const accessResponse = await fetch(`/api/chat/access-check/${doctorId}`)
        const accessData = await accessResponse.json()

        console.log('Access check response:', accessData)
        setAccessInfo(accessData)

        if (!accessData.hasAccess) {
          setError(accessData.message || 'You need an active appointment to chat with this doctor.')
          setLoading(false)
          return
        }

        setHasAccess(true)

        // Fetch appointment details if we have an appointment ID
        if (accessData.appointmentId) {
          const appointmentResponse = await fetch(`/api/appointments/${accessData.appointmentId}`)
          
          if (appointmentResponse.ok) {
            const appointmentData = await appointmentResponse.json()
            // The API returns the appointment directly, not wrapped in an object
            setAppointment(appointmentData)
          } else {
            console.warn('Could not fetch appointment details, but allowing chat access')
            // Create a basic appointment object from access data
            setAppointment({
              id: accessData.appointmentId,
              scheduledDate: accessData.scheduledDate,
              status: accessData.appointmentStatus,
              doctor: null // Will be fetched separately if needed
            } as Appointment)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An error occurred while loading the chat')
      } finally {
        setLoading(false)
      }
    }

    checkAccessAndFetchData()
  }, [session, doctorId])

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to access the chat</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">
              {error || 'You need an active appointment to chat with this doctor.'}
            </p>
            <button
              onClick={() => router.back()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                {appointment.doctor?.user?.profile?.avatar ? (
                  <Image
                    src={appointment.doctor.user.profile.avatar}
                    alt={`Dr. ${appointment.doctor.user.profile.firstName} ${appointment.doctor.user.profile.lastName}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : appointment.doctor?.user?.profile?.firstName ? (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {appointment.doctor.user.profile.firstName[0]}
                      {appointment.doctor.user.profile.lastName[0]}
                    </span>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">Dr</span>
                  </div>
                )}
                
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {appointment.doctor?.user?.profile ? 
                      `Dr. ${appointment.doctor.user.profile.firstName} ${appointment.doctor.user.profile.lastName}` :
                      'Doctor'
                    }
                  </h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">
                      {appointment.doctor?.specialization || 'Healthcare Provider'}
                    </p>
                    {accessInfo?.timing && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        accessInfo.timing.isUpcoming ? 'bg-blue-100 text-blue-800' :
                        accessInfo.timing.isCurrent ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {accessInfo.timing.isUpcoming ? '⏰ Before appointment' :
                         accessInfo.timing.isCurrent ? '🟢 During consultation' :
                         '📅 After appointment'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === 'video'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <VideoCameraIcon className="w-4 h-4" />
                  <span>Video Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)]"
        >
          {activeTab === 'chat' && (
            <Chat
              appointmentId={appointment.id}
              isActive={true}
            />
          )}
          
          {activeTab === 'video' && (
            <VideoCall
              appointmentId={appointment.id}
              isActive={true}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}