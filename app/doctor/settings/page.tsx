'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Doctor {
  id: string
  userId: string
  licenseNumber: string
  specialization: string
  subSpecializations?: string[]
  experience: number
  country: string
  consultationFee: number
  currency: string
  isAvailable: boolean
  languages: string[]
  bio?: string
  education?: string[]
  certifications?: string[]
  rating: number
  totalConsultations: number
  user: {
    id: string
    email: string
    role: string
    profile: {
      firstName: string
      lastName: string
      phone?: string
      dateOfBirth?: string
      avatar?: string
    }
  }
}

export default function DoctorSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Editable form state (only for fields that can be changed)
  const [bio, setBio] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [languages, setLanguages] = useState<string[]>([])
  const [education, setEducation] = useState<string[]>([''])
  const [certifications, setCertifications] = useState<string[]>([''])
  
  // Availability schedule state
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { available: false, startTime: '', endTime: '' },
    tuesday: { available: false, startTime: '', endTime: '' },
    wednesday: { available: false, startTime: '', endTime: '' },
    thursday: { available: false, startTime: '', endTime: '' },
    friday: { available: false, startTime: '', endTime: '' },
    saturday: { available: false, startTime: '', endTime: '' },
    sunday: { available: false, startTime: '', endTime: '' }
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchDoctorProfile()
  }, [session, status, router])

  const fetchDoctorProfile = async () => {
    try {
      const response = await fetch('/api/doctors/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const data = await response.json()
      setDoctor(data.doctor)
      
      // Populate only editable form fields
      setBio(data.doctor.bio || '')
      setConsultationFee(data.doctor.consultationFee?.toString() || '')
      setPhone(data.doctor.user.profile?.phone || '')
      setDateOfBirth(
        data.doctor.user.profile?.dateOfBirth 
          ? new Date(data.doctor.user.profile.dateOfBirth).toISOString().split('T')[0]
          : ''
      )
      setIsAvailable(data.doctor.isAvailable)
      setLanguages(data.doctor.languages || [])
      setEducation(data.doctor.education && data.doctor.education.length > 0 ? data.doctor.education : [''])
      setCertifications(data.doctor.certifications && data.doctor.certifications.length > 0 ? data.doctor.certifications : [''])
      
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailabilitySchedule = async () => {
    try {
      const response = await fetch('/api/doctors/availability')
      if (response.ok) {
        const data = await response.json()
        setWeeklySchedule(data.weeklySchedule)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  const saveAvailabilitySchedule = async () => {
    try {
      const response = await fetch('/api/doctors/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklySchedule })
      })

      if (!response.ok) throw new Error('Failed to save availability')

      const data = await response.json()
      setMessage({ type: 'success', text: `Availability schedule updated successfully! (${data.slots} time slots saved)` })
      setIsAvailabilityModalOpen(false)
    } catch (error) {
      console.error('Error saving availability:', error)
      setMessage({ type: 'error', text: 'Failed to save availability schedule' })
    }
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/doctors/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          consultationFee: parseFloat(consultationFee) || 0,
          phone: phone.trim(),
          dateOfBirth: dateOfBirth || null,
          isAvailable,
          languages: languages.filter(lang => lang.trim()),
          education: education.filter(edu => edu.trim()),
          certifications: certifications.filter(cert => cert.trim())
        })
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      fetchDoctorProfile() // Refresh data
      
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      return
    }

    setIsUpdating(true)
    
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update password')
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setIsPasswordModalOpen(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update password' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManageAvailability = () => {
    setIsAvailabilityModalOpen(true)
    fetchAvailabilitySchedule()
  }

  const handleSignOut = () => {
    window.location.href = '/api/auth/signout'
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setMessage({ type: 'error', text: 'Account deletion feature coming soon! Please contact support for account deletion.' })
    }
  }

  const addEducationField = () => {
    setEducation([...education, ''])
  }

  const removeEducationField = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const updateEducationField = (index: number, value: string) => {
    const updated = [...education]
    updated[index] = value
    setEducation(updated)
  }

  const addCertificationField = () => {
    setCertifications([...certifications, ''])
  }

  const removeCertificationField = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const updateCertificationField = (index: number, value: string) => {
    const updated = [...certifications]
    updated[index] = value
    setCertifications(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Profile Settings</h1>
              <p className="text-black mt-1">Manage your professional profile and account settings</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-black hover:text-gray-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  value={doctor?.user.email || ''}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                />
                <p className="text-xs text-black mt-1">Cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">First Name</label>
                  <input
                    type="text"
                    value={doctor?.user.profile?.firstName || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                  />
                  <p className="text-xs text-black mt-1">Cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Last Name</label>
                  <input
                    type="text"
                    value={doctor?.user.profile?.lastName || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                  />
                  <p className="text-xs text-black mt-1">Cannot be changed</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                  placeholder="Enter mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Specialization</label>
                <input
                  type="text"
                  value={doctor?.specialization || 'Not provided'}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                />
                <p className="text-xs text-black mt-1">Cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Experience (Years)</label>
                <input
                  type="text"
                  value={doctor?.experience ? `${doctor.experience} years` : 'Not provided'}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                />
                <p className="text-xs text-black mt-1">Cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Country</label>
                <input
                  type="text"
                  value={doctor?.country || 'Not provided'}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                />
                <p className="text-xs text-black mt-1">Cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Consultation Fee (NGN)</label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Languages Spoken</label>
                <input
                  type="text"
                  value={languages.join(', ')}
                  onChange={(e) => setLanguages(e.target.value.split(',').map(lang => lang.trim()))}
                  placeholder="English, Arabic, French"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Brief description about yourself and your practice"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Education</label>
                {education.map((edu, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={edu}
                      onChange={(e) => updateEducationField(index, e.target.value)}
                      placeholder="e.g., MD from University of Lagos"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {education.length > 1 && (
                      <button
                        onClick={() => removeEducationField(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addEducationField}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Education
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Certifications</label>
                {certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => updateCertificationField(index, e.target.value)}
                      placeholder="e.g., Board Certified in Internal Medicine"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    {certifications.length > 1 && (
                      <button
                        onClick={() => removeCertificationField(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCertificationField}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Certification
                </button>
              </div>
            </div>
          </div>

          {/* Availability & Account Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability & Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Availability Status</label>
                <select
                  value={isAvailable.toString()}
                  onChange={(e) => setIsAvailable(e.target.value === 'true')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="true">Available for consultations</option>
                  <option value="false">Not available</option>
                </select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Update Password
                </button>

                <button
                  onClick={handleManageAvailability}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Manage Availability
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Sign Out
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Management Modal */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Manage Availability</h3>
              <button
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-black mb-6">
              Set your availability schedule so patients can only book appointments during your available hours.
            </p>

            <div className="space-y-6">
              {Object.entries(weeklySchedule).map(([day, schedule]) => (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 capitalize">{day}</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={schedule.available}
                        onChange={(e) => setWeeklySchedule(prev => ({
                          ...prev,
                          [day]: { ...prev[day as keyof typeof prev], available: e.target.checked }
                        }))}
                        className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-black">Available</span>
                    </label>
                  </div>

                  {schedule.available && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">Start Time</label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => setWeeklySchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], startTime: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">End Time</label>
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => setWeeklySchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], endTime: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvailabilitySchedule}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}