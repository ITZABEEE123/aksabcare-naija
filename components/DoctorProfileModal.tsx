'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, MapPinIcon, ClockIcon, StarIcon, GlobeAltIcon, AcademicCapIcon, UserIcon, HeartIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface Doctor {
  id: string
  specialization: string
  subSpecializations: string[]
  experience: number
  education: string[]
  languages: string[]
  country: string
  bio: string
  consultationFee: number
  rating: number
  totalConsultations: number
  isAvailable: boolean
  certifications: string[]
  user: {
    email: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  _count: {
    reviews: number
  }
}

interface DoctorProfileModalProps {
  doctor: Doctor | null
  isOpen: boolean
  onClose: () => void
  onBookConsultation: (doctor: Doctor) => void
}

export default function DoctorProfileModal({ doctor, isOpen, onClose, onBookConsultation }: DoctorProfileModalProps) {
  if (!doctor) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 to-green-600 px-6 py-8 text-white">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                  
                  <div className="flex items-start space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/20 border-2 border-white/30">
                        {doctor.user.profile.avatar ? (
                          <Image
                            src={doctor.user.profile.avatar}
                            alt={`Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="w-12 h-12 text-white/70" />
                          </div>
                        )}
                      </div>
                      {doctor.isAvailable && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h2 className="text-3xl font-bold mb-2">
                        Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}
                      </h2>
                      <p className="text-xl text-white/90 mb-3">{doctor.specialization}</p>
                      
                      <div className="flex items-center space-x-4 text-white/80">
                        <div className="flex items-center">
                          <MapPinIcon className="w-5 h-5 mr-2" />
                          {doctor.country}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-5 h-5 mr-2" />
                          {doctor.experience} years experience
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="w-5 h-5 mr-2" />
                          {doctor.rating} ({doctor._count.reviews} reviews)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(doctor.consultationFee)}
                      </div>
                      <p className="text-white/80 text-sm">per consultation</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* About */}
                      <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <UserIcon className="w-6 h-6 mr-2 text-blue-600" />
                          About Dr. {doctor.user.profile.lastName}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
                      </section>

                      {/* Education */}
                      {doctor.education && doctor.education.length > 0 && (
                        <section>
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <AcademicCapIcon className="w-6 h-6 mr-2 text-blue-600" />
                            Education & Qualifications
                          </h3>
                          <div className="space-y-3">
                            {doctor.education.map((edu, index) => (
                              <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <CheckBadgeIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{edu}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Certifications */}
                      {doctor.certifications && doctor.certifications.length > 0 && (
                        <section>
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <CheckBadgeIcon className="w-6 h-6 mr-2 text-green-600" />
                            Certifications
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {doctor.certifications.map((cert, index) => (
                              <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                <CheckBadgeIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 text-sm font-medium">{cert}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Specializations */}
                      <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <HeartIcon className="w-6 h-6 mr-2 text-red-500" />
                          Specializations
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold border border-blue-200">
                            {doctor.specialization}
                          </span>
                          {doctor.subSpecializations.map((spec, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium border">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </section>

                      {/* Languages */}
                      <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <GlobeAltIcon className="w-6 h-6 mr-2 text-purple-600" />
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {doctor.languages.map((language, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 px-3 py-2 rounded-full text-sm font-medium border border-purple-200">
                              {language}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                      {/* Rating */}
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                        <h4 className="font-bold text-gray-900 mb-3">Patient Rating</h4>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-yellow-600 mb-2">{doctor.rating}</div>
                          <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <StarSolid
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(doctor.rating) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-600 text-sm">Based on {doctor._count.reviews} reviews</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-gray-900 mb-4">Experience</h4>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{doctor.experience}</div>
                            <p className="text-blue-700 text-sm">Years of Experience</p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{doctor.totalConsultations}</div>
                            <p className="text-blue-700 text-sm">Total Consultations</p>
                          </div>
                        </div>
                      </div>

                      {/* Availability */}
                      <div className={`p-6 rounded-xl border ${
                        doctor.isAvailable 
                          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                          : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                      }`}>
                        <h4 className="font-bold text-gray-900 mb-3">Availability</h4>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            doctor.isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`font-medium ${
                            doctor.isAvailable ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {doctor.isAvailable ? 'Available Now' : 'Currently Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  
                  <motion.button
                    onClick={() => {
                      onBookConsultation(doctor)
                      onClose()
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Book Consultation - {formatCurrency(doctor.consultationFee)}
                  </motion.button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}