'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/footer'
import { 
  MapIcon, 
  PhoneIcon, 
  ClockIcon, 
  HeartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  BuildingOffice2Icon
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
  } | null
  phone: string
  email: string
  website: string
  specializations: string[]
  services: Array<{ 
    id: string
    name: string
    description: string
    price: number
    currency: string
  }>
  establishedYear: number
  isEmergencyAvailable: boolean
  stats: {
    reviews: number
    doctors: number
    appointments: number
  }
  distance?: number
}

interface SearchFilters {
  query: string
  city: string
  specialization: string
  isEmergencyAvailable: boolean
  sortBy: string
}

export default function HospitalDirectoryPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    city: '',
    specialization: '',
    isEmergencyAvailable: false,
    sortBy: 'rating'
  })
  const [favorites, setFavorites] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in kilometers
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  // Specializations available in Abuja hospitals
  const specializations = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 
    'Obstetrics & Gynecology', 'General Surgery', 'Internal Medicine',
    'Emergency Medicine', 'ENT', 'Urology', 'Dermatology', 'Oncology',
    'Fertility & Genetics', 'Mental Health', 'Family Medicine'
  ]

  const cities = [
    'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Jabi', 'Utako', 
    'Gwarinpa', 'Life Camp', 'Apo', 'Kubwa', 'Nyanya', 'Karu', 
    'Gwagwalada', 'Lugbe', 'Airport Road', 'Central Business District'
  ]

  const fetchHospitals = useCallback(async () => {
    setLoading(true)
    setError('')
    setIsAnimating(true)

    try {
      const params = new URLSearchParams()
      
      if (searchFilters.query) params.append('query', searchFilters.query)
      if (searchFilters.city) params.append('city', searchFilters.city)
      if (searchFilters.specialization) {
        params.append('specializations', searchFilters.specialization)
      }
      if (searchFilters.isEmergencyAvailable) params.append('isEmergencyAvailable', 'true')
      
      params.append('state', 'FCT') // Default to FCT (Abuja)
      params.append('limit', '25')

      const response = await fetch(`/api/hospitals-simple?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hospitals')
      }

      console.log('API Response:', data) // Debug log

      let hospitalsWithDistance = [...data.hospitals]

      // Calculate distances if user location is available
      if (userLocation) {
        hospitalsWithDistance = hospitalsWithDistance.map(hospital => ({
          ...hospital,
          distance: hospital.address?.latitude && hospital.address?.longitude
            ? calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                hospital.address.latitude, 
                hospital.address.longitude
              )
            : undefined
        }))
      }

      // Sort hospitals based on selected criteria
      switch (searchFilters.sortBy) {
        case 'rating':
          hospitalsWithDistance.sort((a, b) => b.rating - a.rating)
          break
        case 'name':
          hospitalsWithDistance.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'distance':
          if (userLocation) {
            hospitalsWithDistance.sort((a, b) => {
              const aDistance = a.distance ?? 999
              const bDistance = b.distance ?? 999
              return aDistance - bDistance
            })
          }
          break
        case 'established':
          hospitalsWithDistance.sort((a, b) => (b.establishedYear || 0) - (a.establishedYear || 0))
          break
      }

      setHospitals(hospitalsWithDistance)
    } catch (error) {
      console.error('Error fetching hospitals:', error)
      setError('Failed to load hospitals. Please try again.')
    } finally {
      setLoading(false)
      setTimeout(() => setIsAnimating(false), 500)
    }
  }, [searchFilters, userLocation])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const toggleFavorite = (hospitalId: string) => {
    setFavorites(prev => 
      prev.includes(hospitalId) 
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    )
  }


  const openGoogleMaps = (hospital: Hospital) => {
    if (hospital.address?.latitude && hospital.address?.longitude) {
      if (userLocation) {
        // Open directions
        const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.address.latitude},${hospital.address.longitude}`
        window.open(url, '_blank')
      } else {
        // Open location
        const url = `https://www.google.com/maps/search/?api=1&query=${hospital.address.latitude},${hospital.address.longitude}`
        window.open(url, '_blank')
      }
    } else if (hospital.address) {
      // Fallback to address search
      const address = `${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state}, Nigeria`
      const url = `https://www.google.com/maps/search/${encodeURIComponent(address)}`
      window.open(url, '_blank')
    } else {
      // No address available
      alert('Address information not available for this hospital')
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  useEffect(() => {
    getUserLocation()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Animated Header */}
      <div className="bg-white shadow-sm border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section with Animation */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 text-sm font-medium mb-6 animate-bounce">
              🏥 25+ Verified Hospitals in Abuja
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-slide-up">
              Find the Right Hospital for Your Needs
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-up delay-100">
              Search by location, specialty, or service. Compare prices and book appointments instantly with Google Maps integration.
            </p>
          </div>

          {/* Enhanced Search Bar with Animation */}
          <div className="max-w-5xl mx-auto animate-slide-up delay-200">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 backdrop-blur-sm">
              {/* Main Search */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search hospitals by name, location, or specialty (e.g., 'National Hospital', 'Cardiology', 'Garki')..."
                  value={searchFilters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="block w-full pl-10 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-black placeholder:text-gray-500 transition-all duration-200"
                />
                <button
                  onClick={fetchHospitals}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                </button>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <select
                  value={searchFilters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-200"
                >
                  <option value="" className="text-gray-500">All Areas in Abuja</option>
                  {cities.map(city => (
                    <option key={city} value={city} className="text-black">{city}</option>
                  ))}
                </select>

                <select
                  value={searchFilters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-200"
                >
                  <option value="" className="text-gray-500">All Specialties</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec} className="text-black">{spec}</option>
                  ))}
                </select>

                <select
                  value={searchFilters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-200"
                >
                  <option value="rating" className="text-black">Sort by Rating</option>
                  <option value="name" className="text-black">Sort by Name</option>
                  <option value="established" className="text-black">Sort by Year Est.</option>
                  {userLocation && <option value="distance" className="text-black">Sort by Distance</option>}
                </select>

                <label className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchFilters.isEmergencyAvailable}
                    onChange={(e) => handleFilterChange('isEmergencyAvailable', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">24/7 Emergency</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Searching hospitals...</p>
            <div className="flex justify-center mt-4 space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchHospitals}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Results Header */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 text-lg">
                  Found <span className="font-semibold text-blue-600">{hospitals.length}</span> hospital{hospitals.length !== 1 ? 's' : ''} in Abuja
                </p>
                <div className="flex items-center space-x-4">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {searchFilters.query && `"${searchFilters.query}"`}
                    {searchFilters.city && ` in ${searchFilters.city}`}
                    {searchFilters.specialization && ` • ${searchFilters.specialization}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Hospital Grid with Staggered Animation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {hospitals.map((hospital, index) => (
                <div 
                  key={hospital.id} 
                  className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 ${
                    isAnimating ? 'animate-slide-up' : ''
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Hospital Header */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <BuildingOffice2Icon className="h-5 w-5 text-blue-500" />
                          {hospital.isEmergencyAvailable && (
                            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              24/7
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                          {hospital.name}
                        </h3>
                        <div className="flex items-center space-x-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <StarSolid
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(hospital.rating) 
                                  ? 'text-yellow-400' 
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600 font-medium">
                            {hospital.rating} ({hospital.stats.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleFavorite(hospital.id)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                      >
                        {favorites.includes(hospital.id) ? (
                          <HeartSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                        )}
                      </button>
                    </div>

                    {/* Hospital Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {hospital.description}
                    </p>

                    {/* Location with Google Maps */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="flex-1">
                          {hospital.address ? `${hospital.address.street}, ${hospital.address.city}` : 'Address not available'}
                          {hospital.distance && (
                            <span className="ml-2 text-blue-600 font-medium">
                              ({hospital.distance.toFixed(1)} km away)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => openGoogleMaps(hospital)}
                          className="ml-2 p-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                          title="Open in Google Maps"
                        >
                          <MapIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <a 
                          href={`tel:${hospital.phone}`} 
                          className="hover:text-blue-600 transition-colors duration-200"
                        >
                          {hospital.phone}
                        </a>
                      </div>
                      {hospital.establishedYear && (
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Established {hospital.establishedYear}</span>
                        </div>
                      )}
                    </div>

                    {/* Specializations */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {hospital.specializations.slice(0, 3).map((spec) => (
                          <span
                            key={spec}
                            className="bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100"
                          >
                            {spec}
                          </span>
                        ))}
                        {hospital.specializations.length > 3 && (
                          <span className="text-gray-500 text-xs font-medium px-3 py-1">
                            +{hospital.specializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hospital Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg py-3 border border-blue-200">
                        <div className="font-bold text-blue-900 text-lg">
                          {hospital.stats.doctors}
                        </div>
                        <div className="text-blue-700 text-xs">Doctors</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg py-3 border border-green-200">
                        <div className="font-bold text-green-900 text-lg">
                          {hospital.services.length}
                        </div>
                        <div className="text-green-700 text-xs">Services</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg py-3 border border-purple-200">
                        <div className="font-bold text-purple-900 text-lg">
                          {hospital.stats.appointments}
                        </div>
                        <div className="text-purple-700 text-xs">Bookings</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <Link
                        href={`/patient/hospitals/${hospital.id}`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold text-center transition-all duration-200 transform hover:scale-105"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => openGoogleMaps(hospital)}
                        className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 p-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                        title="Get Directions"
                      >
                        <MapIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hospitals.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BuildingOffice2Icon className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No hospitals found
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    We couldn&apos;t find any hospitals matching your search criteria. Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={() => {
                      setSearchFilters({
                        query: '',
                        city: '',
                        specialization: '',
                        isEmergencyAvailable: false,
                        sortBy: 'rating'
                      })
                      fetchHospitals()
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
        
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
