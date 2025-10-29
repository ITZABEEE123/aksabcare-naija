'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import io, { Socket } from 'socket.io-client'
import { motion } from 'framer-motion'
import { 
  VideoCameraIcon, 
  PhoneXMarkIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline'
import Chat from '@/components/chat'
import VideoCall from '@/components/videocall'

interface Appointment {
  id: string
  scheduledDate: string
  patient: {
    user: {
      profile: {
        firstName: string
        lastName: string
      }
    }
  }
}

export default function DoctorChatPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const patientId = params?.patientId as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [inVideoCall, setInVideoCall] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat')

  useEffect(() => {
    if (!session?.user || !patientId) return

    const initializeChat = async () => {
      setLoading(true)
      try {
        // Find appointment with this patient
        const appointmentResponse = await fetch(`/api/appointments/doctor/${patientId}`)
        const appointmentData = await appointmentResponse.json()

        if (!appointmentData.appointment) {
          setError('No active appointment found with this patient.')
          setLoading(false)
          return
        }

        setAppointment(appointmentData.appointment)

        // Initialize Socket.IO
        const socketInstance = io(process.env.NEXT_PUBLIC_BASE_URL!, {
          path: '/api/socketio'
        })

        setSocket(socketInstance)

        socketInstance.on('connect', () => {
          console.log('Connected to socket server')
          socketInstance.emit('join-appointment', appointmentData.appointment.id)
        })

        // Video call event listeners only
        socketInstance.on('incoming-call', () => {
          setInVideoCall(true)
          setActiveTab('video')
        })

        socketInstance.on('call-ended', () => {
          setInVideoCall(false)
          setActiveTab('chat')
        })

        setLoading(false)

        return () => {
          socketInstance.disconnect()
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        setError('Failed to load chat. Please try again.')
        setLoading(false)
      }
    }

    initializeChat()
  }, [session, patientId])

  const startVideoCall = () => {
    if (!socket || !appointment) return
    socket.emit('start-video-call', appointment.id)
    setInVideoCall(true)
    setActiveTab('video')
  }

  const endVideoCall = () => {
    if (!socket || !appointment) return
    socket.emit('end-call', appointment.id)
    setInVideoCall(false)
    setActiveTab('chat')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">
                    {appointment?.patient?.user?.profile?.firstName} {appointment?.patient?.user?.profile?.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">Patient Chat</p>
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
              
              {/* Video Call Controls */}
              <div className="flex space-x-2">
                {!inVideoCall ? (
                  <button
                    onClick={startVideoCall}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                    <span>Start Video Call</span>
                  </button>
                ) : (
                  <button
                    onClick={endVideoCall}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <PhoneXMarkIcon className="h-5 w-5" />
                    <span>End Call</span>
                  </button>
                )}
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
              appointmentId={appointment?.id || ''}
              isActive={true}
            />
          )}
          
          {activeTab === 'video' && (
            <VideoCall
              appointmentId={appointment?.id || ''}
              isActive={true}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}