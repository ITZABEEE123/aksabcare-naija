'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { UserIcon as UserSolid } from '@heroicons/react/24/solid'

/**
 * User Profile Interface
 * 
 * Defines the comprehensive structure for user profile data including personal information,
 * contact details, address information, and account metadata.
 * 
 * This interface ensures type safety across the profile management system and
 * provides clear documentation for the expected data structure.
 * 
 * Profile Data Categories:
 * 1. Identity: Basic user identification (id, name, email)
 * 2. Contact: Communication details (phone, email)
 * 3. Personal: Private information (date of birth)
 * 4. Location: Address information with full geographic details
 * 5. Metadata: Account creation and management timestamps
 * 
 * Data Sources:
 * - User table: Basic account information
 * - UserProfile table: Extended profile details
 * - Address table: Geographic and contact address data
 */
interface UserProfileData {
  /** Unique user identifier from the database */
  id: string
  
  /** User's first name from profile data */
  firstName: string
  
  /** User's last name from profile data */
  lastName: string
  
  /** Primary email address for account and communication */
  email: string
  
  /** Optional phone number for contact purposes */
  phone?: string
  
  /** Optional date of birth in ISO string format */
  dateOfBirth?: string
  
  /** 
   * Complete address information with optional fields
   * Supports partial addresses and international locations
   */
  address?: {
    /** Optional address record identifier */
    id?: string
    /** Street address including number and street name */
    street: string
    /** City or locality name */
    city: string
    /** State, province, or region */
    state: string
    /** Country name (defaults to Nigeria) */
    country: string
    /** Optional postal/ZIP code */
    postalCode?: string
  }
  
  /** 
   * Account creation timestamp in ISO string format
   * Used for displaying membership duration and account history
   */
  createdAt?: string
}

/**
 * Profile Page Component
 * 
 * A comprehensive user profile management page that provides:
 * - Display of user account information (name, email, phone, address, date of birth)
 * - Editable fields for address and date of birth
 * - Read-only display for name, email, and phone (cannot be changed)
 * - Sign out functionality
 * - Account deletion with confirmation
 * - Responsive design with beautiful UI
 * - Form validation and error handling
 * - Loading states and user feedback
 */
export default function ProfilePage() {
  // Authentication and routing hooks
  const { data: session, status } = useSession()
  const router = useRouter()

  // State management for profile data and UI states
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Edit mode states for different sections
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingDateOfBirth, setEditingDateOfBirth] = useState(false)
  
  // Form data for editable fields
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: ''
  })
  const [dateOfBirthForm, setDateOfBirthForm] = useState('')
  
  // Account deletion confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')

  /**
   * Fetches user profile data from the API
   * Retrieves comprehensive profile information including address details
   */
  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfile(data)
      
      // Initialize form data with existing values
      if (data.address) {
        setAddressForm({
          street: data.address.street || '',
          city: data.address.city || '',
          state: data.address.state || '',
          country: data.address.country || 'Nigeria',
          postalCode: data.address.postalCode || ''
        })
      }
      
      if (data.dateOfBirth) {
        const date = new Date(data.dateOfBirth)
        setDateOfBirthForm(date.toISOString().split('T')[0])
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Updates user profile address information
   * Sends updated address data to the API and refreshes profile
   */
  const updateAddress = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/users/profile/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update address')
      }
      
      await fetchProfile()
      setEditingAddress(false)
      setSuccessMessage('Address updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Updates user date of birth
   * Sends updated date of birth to the API and refreshes profile
   */
  const updateDateOfBirth = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/users/profile/date-of-birth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateOfBirth: dateOfBirthForm }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update date of birth')
      }
      
      await fetchProfile()
      setEditingDateOfBirth(false)
      setSuccessMessage('Date of birth updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update date of birth')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handles user sign out
   * Uses NextAuth signOut function and redirects to home page
   */
  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true, 
        callbackUrl: '/' 
      })
    } catch {
      setError('Failed to sign out')
    }
  }

  /**
   * Handles account deletion
   * Requires confirmation and permanently deletes the user account
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete account')
      }
      
      // Sign out and redirect after successful deletion
      await signOut({ 
        redirect: true, 
        callbackUrl: '/' 
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Cancels address editing and resets form to original values
   */
  const cancelAddressEdit = () => {
    if (profile?.address) {
      setAddressForm({
        street: profile.address.street || '',
        city: profile.address.city || '',
        state: profile.address.state || '',
        country: profile.address.country || 'Nigeria',
        postalCode: profile.address.postalCode || ''
      })
    }
    setEditingAddress(false)
    setError(null)
  }

  /**
   * Cancels date of birth editing and resets form to original value
   */
  const cancelDateOfBirthEdit = () => {
    if (profile?.dateOfBirth) {
      const date = new Date(profile.dateOfBirth)
      setDateOfBirthForm(date.toISOString().split('T')[0])
    }
    setEditingDateOfBirth(false)
    setError(null)
  }

  /**
   * Formats date for display in a user-friendly format
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Load profile data on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Loading state while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated state - should redirect but show fallback
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view your profile.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Error state with retry option
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <UserIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchProfile}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Main profile page render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header with back navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/patient"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            
            {/* Success message */}
            {successMessage && (
              <div className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <CheckIcon className="w-4 h-4 mr-2" />
                {successMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-12">
            <div className="flex items-center space-x-6">
              {/* Profile avatar */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <UserSolid className="w-12 h-12 text-blue-600" />
              </div>
              
              {/* 
                PROFILE HEADER INFORMATION SECTION
                
                Displays the user's primary identification information in the profile header.
                This section provides a clear visual hierarchy with user name, email, and
                membership information against a beautiful gradient background.
                
                Information Display:
                1. User Name: Full name from profile data (firstName + lastName)
                2. Email Address: Primary email from session data
                3. Membership Duration: Calculated from profile creation date
                
                Design Features:
                - White text on gradient background for high contrast
                - Hierarchical typography (3xl for name, lg for email, sm for membership)
                - Color-coded text (white, blue-100, blue-200) for visual hierarchy
                - Responsive spacing and alignment
                
                Data Sources:
                - profile: User's detailed profile information from database
                - session: Authentication session data from NextAuth
                - Fallbacks provided for missing data to prevent errors
              */}
              <div className="text-white">
                {/* 
                  USER FULL NAME DISPLAY
                  
                  Primary identification showing the user's complete name.
                  Uses large, bold typography to establish clear hierarchy.
                */}
                <h1 className="text-3xl font-bold mb-2">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                
                {/* 
                  EMAIL ADDRESS DISPLAY
                  
                  Secondary identification showing the user's email address.
                  Slightly smaller and lighter color to maintain hierarchy.
                */}
                <p className="text-blue-100 text-lg">
                  {session?.user?.email}
                </p>
                
                {/* 
                  MEMBERSHIP INFORMATION
                  
                  Shows when the user joined the platform using profile creation date.
                  Provides context about user's history with the platform.
                  
                  Data Handling:
                  - Uses profile.createdAt from database (more reliable than session)
                  - Extracts year only for cleaner display
                  - Provides fallback for missing or invalid dates
                  - Graceful error handling prevents crashes
                */}
                <p className="text-blue-200 text-sm">
                  Member since {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XMarkIcon className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
            
            <div className="space-y-6">
              
              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 font-medium">
                    {profile?.firstName} {profile?.lastName}
                  </span>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Cannot be changed
                  </span>
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 font-medium">{profile?.email}</span>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Cannot be changed
                  </span>
                </div>
              </div>

              {/* Phone (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900 font-medium">
                    {profile?.phone || 'Not provided'}
                  </span>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Cannot be changed
                  </span>
                </div>
              </div>

              {/* Date of Birth (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  {!editingDateOfBirth && (
                    <button
                      onClick={() => setEditingDateOfBirth(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
                
                {editingDateOfBirth ? (
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={dateOfBirthForm}
                      onChange={(e) => setDateOfBirthForm(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={updateDateOfBirth}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelDateOfBirthEdit}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-400 mr-3" />
                    <span className="text-gray-900 font-medium">
                      {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Address</h2>
              {!editingAddress && (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>

            {editingAddress ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="Enter street address"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="City"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">Select State</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Kano">Kano</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Oyo">Oyo</option>
                      {/* Add more states as needed */}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="Nigeria">Nigeria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      placeholder="Postal code"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={updateAddress}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    onClick={cancelAddressEdit}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.address ? (
                  <div className="flex items-start p-4 bg-green-50 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 mb-1">
                        {profile.address.street}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {profile.address.city}, {profile.address.state}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {profile.address.country}
                        {profile.address.postalCode && ` ${profile.address.postalCode}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-500">No address provided</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Actions</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
              Sign Out
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-gray-600">
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type &quot;DELETE&quot; to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black placeholder-gray-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirmationText !== 'DELETE'}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmation(false)
                    setDeleteConfirmationText('')
                    setError(null)
                  }}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}