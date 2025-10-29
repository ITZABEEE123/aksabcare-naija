'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  VideoCameraIcon,
  UserIcon,
  CheckBadgeIcon,
  LanguageIcon,
  AcademicCapIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid, HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

// ### CORRECTED: Added specific types for Flutterwave to avoid 'any'
interface FlutterwaveResponse {
  status: 'successful' | 'cancelled' | 'failed'
  transaction_id?: string
  tx_ref: string
}

interface FlutterwaveCheckoutOptions {
  public_key: string
  tx_ref: string
  amount: number
  currency: string
  payment_options: string
  customer: {
    email: string
    phone_number: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo: string
  }
  callback: (response: FlutterwaveResponse) => Promise<void>
  onclose: () => void
}

// ### CORRECTED: Added a declaration for the Flutterwave function on the window object
declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveCheckoutOptions) => void
  }
}


interface Doctor {
  id: string
  licenseNumber: string
  specialization: string
  subSpecializations: string[]
  experience: number
  country: string
  consultationFee: number
  languages: string[]
  bio: string
  education: {
    degree: string
    university: string
  }
  certifications: string[]
  rating: number
  totalConsultations: number
  isAvailable: boolean
  user: {
    profile: {
      firstName: string
      lastName: string
      avatar: string | null
    }
  }
  availability: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    timezone: string
    isActive: boolean
  }>
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
  _count: {
    reviews: number
    appointments: number
  }
}

interface TimeSlot {
  time: string
  displayTime: string
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function DoctorDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [consultationNotes, setConsultationNotes] = useState('')
  const [bookingStep, setBookingStep] = useState(1) // 1: Date/Time, 2: Details, 3: Payment
  const [isBooking, setIsBooking] = useState(false)

  // UI states
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('about')

  // ### CORRECTED: Wrapped fetchDoctor in useCallback
  const fetchDoctor = useCallback(async () => {
    if (!params?.id) {
      setError('Invalid doctor ID')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/doctors/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctor')
      }

      setDoctor(data)
    } catch (error) {
      console.error('Error fetching doctor:', error)
      setError('Failed to load doctor details')
    } finally {
      setLoading(false)
    }
  }, [params?.id])

  useEffect(() => {
    if (params?.id) {
      fetchDoctor()
    }
  }, [params?.id, fetchDoctor]) // ### CORRECTED: Added fetchDoctor to dependency array

  // ### CORRECTED: Wrapped fetchAvailableSlots in useCallback
  const fetchAvailableSlots = useCallback(async (date: string) => {
    if (!doctor) return

    try {
      const response = await fetch(`/api/doctors/${doctor.id}/availability?date=${date}`)
      const data = await response.json()

      if (response.ok) {
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }, [doctor])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate, fetchAvailableSlots]) // ### CORRECTED: Added fetchAvailableSlots to dependency array


  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleBookingNext = () => {
    if (bookingStep < 3) {
      setBookingStep(bookingStep + 1)
    }
  }

  const handleBookingBack = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1)
    }
  }

  const handlePayment = async () => {
    if (!doctor || !session?.user) return

    setIsBooking(true)

    // ### CORRECTED: Cast session.user to a more specific type to access custom properties
    const user = session.user as {
      email?: string | null
      phone?: string | null
      firstName?: string | null
      lastName?: string | null
    }

    try {
      if (window.FlutterwaveCheckout && process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY) {
        window.FlutterwaveCheckout({
          public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
          tx_ref: `consultation_${Date.now()}`,
          amount: doctor.consultationFee,
          currency: 'NGN',
          payment_options: 'card, banktransfer, ussd',
          customer: {
            email: user.email || '',
            phone_number: user.phone || '',
            name: `${user.firstName} ${user.lastName}`
          },
          customizations: {
            title: 'AksabHealth Consultation',
            description: `Consultation with Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`,
            logo: '/logo.png'
          },
          meta: {
            doctorId: doctor.id,
            patientEmail: user.email || '',
            scheduledAt: new Date(selectedTime).toISOString(),
            consultationType: 'VIRTUAL',
            notes: consultationNotes
          },
          callback: async (response: FlutterwaveResponse) => {
            if (response.status === 'successful' && response.transaction_id) {
              // Don't create appointment here - let the payment verification webhook handle it
              // This prevents duplicate appointments
              setShowBookingModal(false)
              // Refresh available slots
              if (selectedDate) {
                fetchAvailableSlots(selectedDate)
              }
              // Reset booking state
              setSelectedDate('')
              setSelectedTime('')
              setConsultationNotes('')
              setBookingStep(1)
              // Show success message
              alert('Payment successful! Your appointment has been booked. You will receive a Google Meet link via email.')
              setIsBooking(false)
            } else {
              setIsBooking(false)
            }
          },
          onclose: () => {
            setIsBooking(false)
          }
        })
      } else {
        throw new Error('Flutterwave checkout not available.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setIsBooking(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const generateDateOptions = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }

    return dates
  }

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
          <p className="text-gray-600 text-lg">Loading doctor details...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Doctor Not Found</h3>
            <p className="text-red-600">{error}</p>
          </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
            {/* Doctor Profile */}
            <div className="flex items-start space-x-6 mb-6 lg:mb-0">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-green-100 shadow-lg">
                  {doctor.user.profile.avatar ? (
                    <Image
                      src={doctor.user.profile.avatar}
                      alt={`Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckBadgeIcon className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}
                    </h1>
                    <p className="text-xl text-blue-600 font-semibold mb-2">{doctor.specialization}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {doctor.country}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {doctor.experience} years experience
                      </div>
                      <div className="flex items-center">
                        <ShieldCheckIcon className="w-4 h-4 mr-1" />
                        {doctor.licenseNumber}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-3 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isFavorite ? (
                      <HeartSolid className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </motion.button>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center space-x-6 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarSolid
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(doctor.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-200'
                          }`}
                      />
                    ))}
                    <span className="ml-2 font-semibold text-gray-700">
                      {doctor.rating} ({doctor._count.reviews} reviews)
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    {doctor.totalConsultations} consultations
                  </div>
                </div>

                {/* Languages */}
                <div className="flex items-center space-x-2 mb-4">
                  <LanguageIcon className="w-5 h-5 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages.map((language) => (
                      <span
                        key={language}
                        className="bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:w-96">
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(doctor.consultationFee)}
                  </div>
                  <p className="text-gray-600">per consultation</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <VideoCameraIcon className="w-5 h-5 mr-2" />
                      <span>Video Consultation</span>
                    </div>
                    <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                  </div>

                  {doctor.country === 'Nigeria' && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center text-gray-600">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <span>In-Person Available</span>
                      </div>
                      <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span>60 minutes</span>
                    </div>
                    <span className="text-gray-900 font-medium">Included</span>
                  </div>
                </div>

                {session ? (
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Book Consultation
                    </motion.button>

                    <motion.button
                      className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span>Send Message</span>
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Sign in to book a consultation</p>
                    <a
                      href="/auth/signin"
                      className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Sign In
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:pr-96">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'about', label: 'About', icon: UserIcon },
                { key: 'availability', label: 'Availability', icon: CalendarIcon },
                { key: 'reviews', label: 'Reviews', icon: StarIcon },
                { key: 'education', label: 'Education', icon: AcademicCapIcon }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.key
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
            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">About Dr. {doctor.user.profile.lastName}</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{doctor.bio}</p>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {doctor.subSpecializations.map((spec) => (
                      <div
                        key={spec}
                        className="bg-gradient-to-r from-blue-50 to-green-50 text-blue-800 px-4 py-3 rounded-xl font-medium border border-blue-100 text-center"
                      >
                        {spec}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Certifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctor.certifications.map((cert) => (
                      <div
                        key={cert}
                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                      >
                        <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                        <span className="font-medium text-gray-800">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'availability' && (
              <motion.div
                key="availability"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900">Weekly Schedule</h3>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctor.availability.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100"
                      >
                        <div className="font-semibold text-gray-900 mb-2">
                          {dayNames[slot.dayOfWeek === 7 ? 0 : slot.dayOfWeek]}
                        </div>
                        <div className="text-sm text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {slot.timezone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Patient Reviews</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarSolid
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(doctor.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-700">
                      {doctor.rating} ({doctor._count.reviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {doctor.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {review.patient.user.profile.firstName} {review.patient.user.profile.lastName[0]}.
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarSolid
                              key={i}
                              className={`w-4 h-4 ${i < review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'education' && (
              <motion.div
                key="education"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Education & Qualifications</h3>
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {doctor.education.degree}
                        </h4>
                        <p className="text-gray-600 text-lg">
                          {doctor.education.university}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Professional Certifications</h4>
                  <div className="space-y-3">
                    {doctor.certifications.map((cert, index) => (
                      <div
                        key={cert}
                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-800">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

              <motion.div
                className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Book Consultation with Dr. {doctor.user.profile.lastName}
                    </h3>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-8">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bookingStep >= step
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {step}
                          </div>
                          {step < 3 && (
                            <div
                              className={`h-1 w-16 mx-2 ${bookingStep > step ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Step Content */}
                    {bookingStep === 1 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Date
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {generateDateOptions().map((date) => {
                              const dateStr = date.toISOString().split('T')[0]
                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => handleDateSelect(dateStr)}
                                  className={`p-3 rounded-lg border text-sm font-medium transition-colors duration-200 ${selectedDate === dateStr
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 hover:border-gray-300 text-black hover:text-black'
                                    }`}
                                >
                                  {(() => {
                                    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const dayName = dayNamesShort[date.getDay()];
                                    const monthName = monthNames[date.getMonth()];
                                    const dayNumber = date.getDate();
                                    return `${dayName}, ${monthName} ${dayNumber}`;
                                  })()}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {selectedDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Select Time
                            </label>
                            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot.time}
                                  onClick={() => handleTimeSelect(slot.time)}
                                  className={`p-2 rounded-lg border text-sm font-medium transition-colors duration-200 ${selectedTime === slot.time
                                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 hover:border-gray-300 text-black hover:text-black'
                                    }`}
                                >
                                  {slot.displayTime}
                                </button>
                              ))}
                            </div>
                            {availableSlots.length === 0 && (
                              <p className="text-black text-sm font-medium">No available slots for this date</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {bookingStep === 2 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Consultation Notes (Optional)
                          </label>
                          <textarea
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-500"
                            placeholder="Please describe your symptoms or reason for consultation..."
                          />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
                          <div className="space-y-1 text-sm text-black">
                            <p>Date: {selectedDate && (() => {
                              const date = new Date(selectedDate);
                              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                              const dayName = dayNames[date.getDay()];
                              const monthName = monthNames[date.getMonth()];
                              const dayNumber = date.getDate();
                              const year = date.getFullYear();
                              return `${dayName}, ${monthName} ${dayNumber}, ${year}`;
                            })()}</p>
                            <p>Time: {selectedTime && (() => {
                              const timeDate = new Date(selectedTime);
                              // Use Nigerian timezone for display
                              const nigerianTime = timeDate.toLocaleTimeString('en-NG', { 
                                timeZone: 'Africa/Lagos', 
                                hour12: true,
                                hour: 'numeric',
                                minute: '2-digit'
                              });
                              return nigerianTime;
                            })()}</p>
                            <p>Duration: 60 minutes</p>
                            <p className="font-semibold text-gray-900">
                              Fee: {formatCurrency(doctor.consultationFee)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {bookingStep === 3 && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-100">
                          <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Consultation Fee</span>
                              <span className="font-semibold">{formatCurrency(doctor.consultationFee)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                              <span>Total</span>
                              <span>{formatCurrency(doctor.consultationFee)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> After payment, you&apos;ll receive a Google Meet link via email
                            for your consultation at the scheduled time.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={handleBookingBack}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${bookingStep === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        disabled={bookingStep === 1}
                      >
                        Back
                      </button>

                      {bookingStep < 3 ? (
                        <button
                          onClick={handleBookingNext}
                          className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                            // Always allow step 2 to continue
                            (bookingStep === 1 && (!selectedDate || !selectedTime))
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          disabled={
                            (bookingStep === 1 && (!selectedDate || !selectedTime))
                          }
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={handlePayment}
                          disabled={isBooking}
                          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50"
                        >
                          {isBooking ? 'Processing...' : 'Pay & Book'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}