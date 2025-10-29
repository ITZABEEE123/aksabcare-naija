'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import Footer from '@/components/layout/footer'
import DoctorBookingModal from '@/components/DoctorBookingModal'
import DoctorProfileModal from '@/components/DoctorProfileModal'
import { useSession } from 'next-auth/react'
import { Doctor as BaseDoctor } from '@/types'

interface Doctor extends BaseDoctor {
  subSpecializations: string[]
  bio: string
  certifications: string[]
  reviews: Array<{
    id: string
    rating: number
    comment: string
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

interface SearchFilters {
  query: string
  specialization: string
  country: string
  consultationType: string
  minExperience: number
  maxFee: number
  minRating: number
  sortBy: string
}

const specializations = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology',
  'General Surgery', 'Internal Medicine', 'Emergency Medicine', 'ENT', 'Urology',
  'Dermatology', 'Oncology', 'Psychiatry', 'Endocrinology', 'Ophthalmology',
  'Anesthesiology', 'Radiology', 'Pathology', 'Rheumatology', 'Hematology',
  'Gastroenterology', 'Family Medicine'
]

const countries = ['Nigeria', 'India', 'United Kingdom', 'Ethiopia', 'Pakistan']

export default function DoctorsPage() {
  const { data: session } = useSession()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    specialization: '',
    country: '',
    consultationType: '',
    minExperience: 0,
    maxFee: 100000,
    minRating: 0,
    sortBy: 'relevance'
  })
  
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [processingDoctorId, setProcessingDoctorId] = useState<string | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleBookConsultation = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setShowBookingModal(true)
  }

  const handleViewProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setShowProfileModal(true)
  }

  const checkChatAccess = async (doctorId: string) => {
    if (!session?.user) return { hasAccess: false, message: 'Please sign in to access chat' }
    
    try {
      const response = await fetch(`/api/chat/access-check/${doctorId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error checking chat access:', error)
      return { hasAccess: false, message: 'Error checking chat access. Please try again.' }
    }
  }

  const handleChatAccess = async (doctor: Doctor) => {
    if (!session?.user) {
      alert('Please sign in to access chat')
      return
    }

    setProcessingDoctorId(doctor.id)
    const accessData = await checkChatAccess(doctor.id)
    
    if (accessData.hasAccess) {
      // Navigate to chat page
      window.location.href = `/patient/chat/${doctor.id}`
    } else {
      // Show the specific message from the API
      alert(accessData.message || 'You need an active appointment to chat with this doctor. Please book a consultation first.')
    }
    
    setProcessingDoctorId(null)
  }

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      
      if (searchFilters.query) params.append('query', searchFilters.query)
      if (searchFilters.specialization) params.append('specialization', searchFilters.specialization)
      if (searchFilters.country) params.append('country', searchFilters.country)
      if (searchFilters.consultationType) params.append('consultationType', searchFilters.consultationType)
      if (searchFilters.minExperience > 0) params.append('minExperience', searchFilters.minExperience.toString())
      if (searchFilters.maxFee < 100000) params.append('maxFee', searchFilters.maxFee.toString())
      if (searchFilters.minRating > 0) params.append('minRating', searchFilters.minRating.toString())
      params.append('sortBy', searchFilters.sortBy)
      params.append('limit', '30')

      const response = await fetch(`/api/doctors?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctors')
      }

      setDoctors(data.doctors)
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setError('Failed to load doctors. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [searchFilters])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | boolean) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleFavorite = (doctorId: string) => {
    setFavorites(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <motion.div 
        className="bg-white shadow-sm border-b relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 text-sm font-medium mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              🩺 50+ International Specialists Available
            </motion.div>
            <motion.h1 
              className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Connect with Expert Specialists.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                {" "}Anytime, Anywhere.
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Book secure virtual consultations with top-rated doctors in Nigeria and around the world. 
              Get expert care from the comfort of your home.
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              {/* Main Search */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search doctors by name, specialty, or condition..."
                  value={searchFilters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="block w-full pl-10 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder-gray-500"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
                  >
                    <FunnelIcon className="h-5 w-5" />
                  </motion.div>
                </button>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <select
                      value={searchFilters.specialization}
                      onChange={(e) => handleFilterChange('specialization', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="" className="text-gray-500">All Specialties</option>
                      {specializations.map(spec => (
                        <option key={spec} value={spec} className="text-black">{spec}</option>
                      ))}
                    </select>

                    <select
                      value={searchFilters.country}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="" className="text-gray-500">All Countries</option>
                      {countries.map(country => (
                        <option key={country} value={country} className="text-black">{country}</option>
                      ))}
                    </select>

                    <select
                      value={searchFilters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    >
                      <option value="relevance" className="text-black">Sort by Relevance</option>
                      <option value="rating" className="text-black">Sort by Rating</option>
                      <option value="experience" className="text-black">Sort by Experience</option>
                      <option value="price" className="text-black">Sort by Price</option>
                    </select>

                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={searchFilters.consultationType === 'VIRTUAL'}
                        onChange={(e) => handleFilterChange('consultationType', e.target.checked ? 'VIRTUAL' : '')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Virtual Only</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {['Cardiology', 'Pediatrics', 'Dermatology', 'Psychiatry'].map(specialty => (
                  <motion.button
                    key={specialty}
                    onClick={() => handleFilterChange('specialization', specialty)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 text-blue-700 rounded-full text-sm font-medium transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {specialty}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Finding the best doctors for you...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <motion.button
                onClick={fetchDoctors}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}

        {!loading && !error && (
          <>
            {/* Results Header */}
            <motion.div 
              className="mb-8 flex items-center justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <p className="text-gray-600 text-lg">
                  Found <span className="font-semibold text-blue-600">{doctors.length}</span> specialist{doctors.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {searchFilters.query && <span>&ldquo;{searchFilters.query}&rdquo;</span>}
                  {searchFilters.specialization && <span>• {searchFilters.specialization}</span>}
                  {searchFilters.country && <span>• {searchFilters.country}</span>}
                </div>
              </div>
            </motion.div>

            {/* Doctors Grid */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {doctors.map((doctor) => (
                <motion.div
                  key={doctor.id}
                  variants={itemVariants}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200"
                  whileHover={{ y: -5 }}
                >
                  {/* Doctor Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-green-100">
                          {doctor.user.profile.avatar ? (
                            <Image
                              src={doctor.user.profile.avatar}
                              alt={`Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}
                          </h3>
                          <motion.button
                            onClick={() => toggleFavorite(doctor.id)}
                            className="p-2 rounded-full hover:bg-gray-100"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg 
                              className={`w-5 h-5 ${favorites.includes(doctor.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                              viewBox="0 0 24 24" 
                              stroke="currentColor" 
                              fill={favorites.includes(doctor.id) ? 'currentColor' : 'none'}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </motion.button>
                        </div>
                        
                        <p className="text-blue-600 font-semibold text-sm mb-1">{doctor.specialization}</p>
                        
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {doctor.country}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {doctor.experience} years
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarSolid
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(doctor.rating) 
                                ? 'text-yellow-400' 
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {doctor.rating} ({doctor._count.reviews} reviews)
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(doctor.consultationFee)}
                        </span>
                        <p className="text-xs text-gray-500">per consultation</p>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {doctor.bio}
                    </p>

                    {/* Specializations */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {doctor.subSpecializations.slice(0, 3).map((spec) => (
                          <span
                            key={spec}
                            className="bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100"
                          >
                            {spec}
                          </span>
                        ))}
                        {doctor.subSpecializations.length > 3 && (
                          <span className="text-gray-500 text-xs font-medium px-3 py-1">
                            +{doctor.subSpecializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Languages & Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg py-3 border border-blue-200">
                        <div className="font-bold text-blue-900 text-lg">
                          {doctor.totalConsultations}
                        </div>
                        <div className="text-blue-700 text-xs">Consultations</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg py-3 border border-green-200">
                        <div className="font-bold text-green-900 text-lg">
                          {doctor.languages.length}
                        </div>
                        <div className="text-green-700 text-xs">Languages</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleBookConsultation(doctor)}
                        >
                          Book Consultation
                        </motion.button>
                        
                        <motion.button
                          className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewProfile(doctor)}
                        >
                          View Profile
                        </motion.button>
                      </div>
                      
                      <motion.button
                        className="w-full bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChatAccess(doctor)}
                        disabled={processingDoctorId === doctor.id}
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span>{processingDoctorId === doctor.id ? 'Checking...' : 'Chat'}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* No Results */}
            {doctors.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No doctors found
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    We couldn&apos;t find any doctors matching your search criteria. 
                    Try adjusting your filters or search terms.
                  </p>
                  <motion.button
                    onClick={() => {
                      setSearchFilters({
                        query: '',
                        specialization: '',
                        country: '',
                        consultationType: '',
                        minExperience: 0,
                        maxFee: 100000,
                        minRating: 0,
                        sortBy: 'relevance'
                      })
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear All Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Booking Modal */}
      <DoctorBookingModal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doctor={selectedDoctor as any}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />

      {/* Profile Modal */}
      <DoctorProfileModal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doctor={selectedDoctor as any}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onBookConsultation={handleBookConsultation as any}
      />

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
