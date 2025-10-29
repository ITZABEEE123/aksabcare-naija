/**
 * Hospital Details Page Component
 * 
 * This is a dynamic route page that displays comprehensive information about a specific hospital.
 * The page is accessed via /patient/hospitals/[id] where [id] is the hospital's unique identifier.
 * 
 * Key Features:
 * - Displays detailed hospital information (name, description, rating, contact details)
 * - Shows hospital services with pricing information
 * - Lists medical specializations offered
 * - Provides interactive Google Maps integration for directions
 * - Includes appointment booking functionality (placeholder)
 * - Responsive design optimized for mobile and desktop
 * - Error handling with user-friendly error states
 * - Loading states with smooth animations
 * - Back navigation to hospital listing page
 * 
 * Data Flow:
 * 1. Extract hospital ID from URL parameters
 * 2. Fetch hospital details from /api/hospitals/[id] endpoint
 * 3. Display comprehensive hospital information
 * 4. Handle user interactions (directions, booking, favorites)
 * 
 * State Management:
 * - hospital: Stores the fetched hospital data
 * - loading: Controls loading spinner visibility
 * - error: Manages error messages and error states
 * - isFavorite: Tracks user's favorite status for this hospital
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  MapIcon, 
  PhoneIcon, 
  HeartIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  CalendarIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface Hospital {
  id: string
  name: string
  description: string
  rating: number
  address: {
    street: string
    city: string
    state: string
    latitude?: number
    longitude?: number
  }
  phone: string
  email: string
  website: string
  specializations: string[]
  services: Array<{ 
    name: string
    description: string
    category: string
    price: number
  }>
  facilityLevel: string
  ownershipType: string
  isEmergencyAvailable: boolean
  establishedYear: number
  _count: {
    reviews: number
    doctors: number
    appointments: number
  }
}

/**
 * Hospital Details Page Component
 * 
 * This component displays comprehensive information about a specific hospital.
 * Features include:
 * - Hospital basic information (name, rating, contact details)
 * - Services offered with pricing
 * - Specializations and facility details
 * - Interactive map integration
 * - Appointment booking capabilities
 */
export default function HospitalDetailsPage() {
  const params = useParams()
  const hospitalId = params?.id as string

  // State management for hospital data and UI states
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  /**
   * Fetches hospital details from the API
   * Makes a GET request to retrieve comprehensive hospital information
   */
  const fetchHospitalDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/hospitals/${hospitalId}`)
      if (!response.ok) {
        throw new Error('Hospital not found')
      }
      
      const data = await response.json()
      setHospital(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hospital details')
    } finally {
      setLoading(false)
    }
  }, [hospitalId])

  /**
   * Opens Google Maps with hospital location for directions
   * Constructs Google Maps URL with hospital coordinates or address
   */
  const openGoogleMaps = (hospital: Hospital) => {
    const { latitude, longitude } = hospital.address
    let url: string

    if (latitude && longitude) {
      // Use coordinates if available for precise location
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    } else {
      // Fall back to address-based search
      const address = `${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state}`
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    }
    
    window.open(url, '_blank')
  }

  /**
   * Toggles favorite status for the hospital
   * Updates user's favorite hospitals list (requires authentication)
   */
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Implement API call to update user's favorites
  }

  /**
   * Handles appointment booking navigation
   * Redirects to booking page with hospital context
   */
  const bookAppointment = () => {
    // TODO: Navigate to booking page or open booking modal
    alert('Appointment booking feature coming soon!')
  }

  // Fetch hospital details on component mount
  useEffect(() => {
    if (hospitalId) {
      fetchHospitalDetails()
    }
  }, [hospitalId, fetchHospitalDetails])

  // Loading state with spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-lg mt-4">Loading hospital details...</p>
        </div>
      </div>
    )
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <BuildingOffice2Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/patient/hospitals"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back to Hospitals
          </Link>
        </div>
      </div>
    )
  }

  // Main hospital details render
  if (!hospital) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header with back navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/patient/hospitals"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Back to Hospitals
            </Link>
            
            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {isFavorite ? (
                <HeartSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hospital details content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main content - Hospital information */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hospital header */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
                  
                  {/* Rating and reviews */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarSolid
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.floor(hospital.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600 font-medium">
                        {hospital.rating} ({hospital._count.reviews} reviews)
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      {hospital._count.doctors} doctors
                    </div>
                  </div>

                  {/* Facility level and type */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {hospital.facilityLevel} Care
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {hospital.ownershipType}
                    </span>
                    {hospital.isEmergencyAvailable && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                        24/7 Emergency
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col space-y-3 mt-4 md:mt-0">
                  <button
                    onClick={bookAppointment}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Book Appointment
                  </button>
                  <button
                    onClick={() => openGoogleMaps(hospital)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    Get Directions
                  </button>
                </div>
              </div>

              {/* Hospital description */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {hospital.description}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{hospital.establishedYear}</div>
                  <div className="text-sm text-gray-600">Established</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{hospital._count.doctors}</div>
                  <div className="text-sm text-gray-600">Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{hospital.specializations.length}</div>
                  <div className="text-sm text-gray-600">Specialties</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{hospital._count.appointments}</div>
                  <div className="text-sm text-gray-600">Appointments</div>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical Specialties</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hospital.specializations.map((specialty, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-gray-800 font-medium">{specialty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Services & Pricing</h2>
              <div className="space-y-4">
                {hospital.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {service.category}
                        </span>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-blue-600">
                          ₦{service.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Contact and location */}
          <div className="space-y-6">
            
            {/* Contact information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <div className="font-medium text-gray-900">Address</div>
                    <div className="text-gray-600 text-sm">
                      {hospital.address.street}<br />
                      {hospital.address.city}, {hospital.address.state}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <a href={`tel:${hospital.phone}`} className="text-blue-600 hover:text-blue-700 text-sm">
                      {hospital.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <a href={`mailto:${hospital.email}`} className="text-blue-600 hover:text-blue-700 text-sm">
                      {hospital.email}
                    </a>
                  </div>
                </div>

                {hospital.website && (
                  <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Website</div>
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency notice */}
            {hospital.isEmergencyAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                  <h3 className="text-lg font-bold text-red-900">24/7 Emergency Services</h3>
                </div>
                <p className="text-red-700 text-sm">
                  This hospital provides round-the-clock emergency medical services. 
                  Contact them directly for urgent medical situations.
                </p>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={bookAppointment}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Book Appointment
                </button>
                
                <button
                  onClick={() => openGoogleMaps(hospital)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  Get Directions
                </button>
                
                <a
                  href={`tel:${hospital.phone}`}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}