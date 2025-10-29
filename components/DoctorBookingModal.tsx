// This tells Next.js that this component runs on the client side (in the browser)
// not on the server. We need this because we use browser features like localStorage
'use client'

// Import React hooks for managing state and side effects
import { useState, useEffect } from 'react'
// Import animation library to make the modal look smooth and professional
import { motion, AnimatePresence } from 'framer-motion'
// Import icons from Heroicons - these are the little pictures we show in buttons
import { 
  XMarkIcon,        // X button to close the modal
  CalendarDaysIcon, // Calendar icon for date selection
  ClockIcon,        // Clock icon for time selection
  CreditCardIcon,   // Credit card icon for payment
  VideoCameraIcon,  // Video camera icon for video consultation
  UserIcon          // Person icon for user information
} from '@heroicons/react/24/outline'
// Import Next.js Image component for optimized image loading
import Image from 'next/image'

// This is a helper function that formats dates in a nice readable way
// Instead of using a big library, we make our own simple one
const formatDate = (date: Date, formatStr: string): string => {
  // List of all the days of the week in order (Sunday = 0, Monday = 1, etc.)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  // List of all the months of the year in order (January = 0, February = 1, etc.)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  // Replace patterns one by one to avoid conflicts
  let result = formatStr
  
  // Replace full day name first (EEEE)
  if (result.includes('EEEE')) {
    result = result.replace(/EEEE/g, days[date.getDay()])
  }
  // Then replace short day name (EEE)
  else if (result.includes('EEE')) {
    result = result.replace(/EEE/g, days[date.getDay()].slice(0, 3))
  }
  
  // Replace full month name (MMMM)
  if (result.includes('MMMM')) {
    result = result.replace(/MMMM/g, months[date.getMonth()])
  }
  
  // Replace year (yyyy)
  if (result.includes('yyyy')) {
    result = result.replace(/yyyy/g, date.getFullYear().toString())
  }
  
  // Replace day of month (d)
  if (result.includes('d')) {
    result = result.replace(/\bd\b/g, date.getDate().toString())
  }
  
  return result
}

const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const isSameDayCheck = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

interface Doctor {
  id: string
  licenseNumber: string
  specialization: string
  experience: number
  consultationFee: number
  isAvailable: boolean
  user: {
    profile: {
      firstName: string
      lastName: string
      avatar: string | null
    }
  }
}

interface TimeSlot {
  time: string
  displayTime: string
  available: boolean
  date: Date
  id: string
}

interface BookingModalProps {
  doctor: Doctor | null
  isOpen: boolean
  onClose: () => void
}

export default function DoctorBookingModal({ 
  doctor, 
  isOpen, 
  onClose
}: BookingModalProps) {
  const [step, setStep] = useState<'calendar' | 'payment' | 'confirmation'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDisplayTime, setSelectedDisplayTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  // Generate next 14 days for calendar
  const calendarDays = Array.from({ length: 14 }, (_, i) => addDaysToDate(new Date(), i))

  useEffect(() => {
    if (!selectedDate || !doctor) return

    const fetchAvailableSlots = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/doctors/${doctor.id}/availability?date=${selectedDate.toISOString()}`)
        const data = await response.json()
        
        if (response.ok) {
          setAvailableSlots(data.slots.map((slot: {time: string, displayTime: string}, index: number) => ({
            time: slot.time,
            displayTime: slot.displayTime,
            available: true,
            date: selectedDate,
            id: `${slot.time}-${index}` // Unique identifier
          })))
        } else {
          console.error('Failed to fetch slots:', data.error)
          setAvailableSlots([])
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
        setAvailableSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, doctor])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setSelectedDisplayTime(null)
  }

  const handleTimeSelect = (time: string) => {
    const slot = availableSlots.find(s => s.time === time)
    setSelectedTime(time)
    setSelectedDisplayTime(slot?.displayTime || null)
  }

  const handleProceedToPayment = () => {
    if (selectedDate && selectedTime && selectedDisplayTime) {
      setStep('payment')
    }
  }

  const handlePayment = async () => {
    if (!doctor || !selectedDate || !selectedTime) return

    setLoading(true)
    try {
      // selectedTime is already a UTC ISO string from the slot generation
      // We don't need to convert it again - just use it directly
      const scheduledDateTime = new Date(selectedTime)

      console.log('Booking with correct timezone:', {
        selectedDate: selectedDate.toISOString(),
        selectedTime,
        scheduledDateTimeUTC: scheduledDateTime.toISOString(),
        scheduledDateTimeWAT: scheduledDateTime.toLocaleString("en-US", {timeZone: "Africa/Lagos"})
      })

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: doctor.consultationFee,
          doctorId: doctor.id,
          scheduledAt: scheduledDateTime.toISOString(),
          consultationType: 'VIRTUAL',
          notes: notes || 'Consultation appointment'
        })
      })

      const paymentData = await response.json()

      if (paymentData.success && paymentData.payment_link) {
        // Store booking details for confirmation after payment
        localStorage.setItem('pendingBooking', JSON.stringify({
          doctor: doctor,
          date: selectedDate,
          time: selectedDisplayTime, // Use display time for storage
          amount: doctor.consultationFee
        }))
        
        // Redirect to payment
        window.location.href = paymentData.payment_link
      } else if (paymentData.fallback && paymentData.debug_url) {
        // Fallback: Use test appointment creation for development
        const fallbackResponse = await fetch(paymentData.debug_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            doctorId: doctor.id,
            scheduledAt: scheduledDateTime.toISOString(),
            notes: notes || 'Test consultation appointment'
          })
        })

        const fallbackData = await fallbackResponse.json()
        
        if (fallbackData.success) {
          alert('Test appointment created successfully! (Payment service is temporarily unavailable)')
          onClose()
          // Refresh the page to show the new appointment
          window.location.reload()
        } else {
          alert('Failed to create appointment: ' + (fallbackData.error || 'Unknown error'))
        }
      } else {
        alert('Failed to initialize payment: ' + (paymentData.error || 'Please try again.'))
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (!doctor) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {doctor.user.profile.avatar ? (
                      <Image
                        src={doctor.user.profile.avatar}
                        alt={`Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`}
                        width={60}
                        height={60}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-white/20 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Book Consultation
                    </h2>
                    <p className="text-blue-100">
                      Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName} • {doctor.specialization}
                    </p>
                    <p className="text-blue-200 text-sm">
                      {doctor.experience} years experience • {formatCurrency(doctor.consultationFee)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {step === 'calendar' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center text-black">
                      <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Select Date & Time
                    </h3>
                    <p className="text-gray-700">Choose your preferred appointment date and time</p>
                  </div>

                  {/* Calendar */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {calendarDays.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-lg text-center transition-colors ${
                          selectedDate && isSameDayCheck(date, selectedDate)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-black'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          {formatDate(date, 'EEE')}
                        </div>
                        <div className="text-sm font-medium">
                          {formatDate(date, 'd')}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold mb-3 flex items-center text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Available Times for {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </h4>
                      
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => handleTimeSelect(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                                selectedTime === slot.time
                                  ? 'bg-blue-600 text-white'
                                  : slot.available
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-black'
                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {slot.displayTime}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-900 font-medium text-center py-8">
                          No available slots for this date
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe your symptoms or concerns..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-500"
                      rows={3}
                    />
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Proceed to Payment
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2 flex items-center text-black">
                      <CreditCardIcon className="w-5 h-5 mr-2 text-green-600" />
                      Confirm & Pay
                    </h3>
                    <p className="text-gray-700">Review your appointment details and make payment</p>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-3 text-black">Appointment Summary</h4>
                    <div className="space-y-2 text-sm text-black">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Doctor:</span>
                        <span className="text-black font-medium">Dr. {doctor.user.profile.firstName} {doctor.user.profile.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Date:</span>
                        <span className="text-black font-medium">{selectedDate && formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Time:</span>
                        <span className="text-black font-medium">{selectedDisplayTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Type:</span>
                        <span className="flex items-center text-black font-medium">
                          <VideoCameraIcon className="w-4 h-4 mr-1 text-blue-600" />
                          Virtual Consultation
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span className="text-gray-700">Total:</span>
                        <span className="text-black">{formatCurrency(doctor.consultationFee)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('calendar')}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Pay Now'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}