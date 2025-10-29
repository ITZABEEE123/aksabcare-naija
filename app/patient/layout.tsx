/**
 * Patient Layout Component
 * 
 * This is the main layout wrapper for all patient-facing pages in the AksabCare platform.
 * It provides consistent navigation, branding, and user interface elements across
 * all patient portal pages.
 * 
 * Key Features:
 * - Responsive navigation header with mobile hamburger menu
 * - Dynamic branding with AksabCare logo and gradient design
 * - Conditional authentication display (profile icon vs sign-in button)
 * - Active route highlighting for current page navigation
 * - Mobile-responsive design with collapsible navigation
 * - Sticky header that remains visible during scrolling
 * - Gradient backgrounds and modern design elements
 * - Integration with NextAuth for user session management
 * 
 * Navigation Structure:
 * - Home: Patient dashboard overview
 * - AI Guide: AI-powered health consultation feature
 * - Hospitals: Hospital directory and search
 * - Doctors: Doctor profiles and booking
 * - Pharmacy: E-pharmacy for medication orders
 * 
 * Authentication Integration:
 * - Displays user profile icon with name when authenticated
 * - Shows sign-in button when not authenticated
 * - Profile icon links to user profile page
 * - Smooth transitions and hover effects
 * 
 * Responsive Design:
 * - Desktop: Full navigation bar with all options visible
 * - Mobile: Hamburger menu with collapsible navigation
 * - Tablet: Optimized spacing and touch-friendly interactions
 */

// app/patient/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserIcon } from '@heroicons/react/24/outline'
import NotificationsDropdown from '@/components/NotificationsDropdown'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'

/**
 * Navigation Item Type Definition
 * 
 * Defines the structure for navigation menu items used throughout the patient portal.
 * Each navigation item includes display name, route path, and emoji icon.
 * 
 * @interface NavItem
 * @property {string} name - Display name shown in navigation menu
 * @property {string} href - Route path for Next.js navigation
 * @property {string} icon - Emoji icon displayed alongside the name
 */
interface NavItem {
  name: string
  href: string
  icon: string
}

/**
 * Patient Layout Component Function
 * 
 * The main layout component that wraps all patient portal pages with consistent
 * navigation, header, and structural elements.
 * 
 * Component State Management:
 * - pathname: Current route path for active navigation highlighting
 * - mobileMenuOpen: Controls mobile navigation menu visibility
 * - session: User authentication session data from NextAuth
 * 
 * Props:
 * @param {React.ReactNode} children - Child components/pages to render within layout
 * 
 * Returns:
 * A complete page layout with navigation header and main content area
 */
export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current pathname for active navigation highlighting
  const pathname = usePathname()
  
  // State for mobile navigation menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Get user session data for authentication-based UI rendering
  const { data: session } = useSession()

  /**
   * Navigation Menu Configuration
   * 
   * Defines the main navigation items displayed in the patient portal header.
   * Each item includes a display name, route path, and descriptive emoji icon.
   * The navigation is used for both desktop and mobile menu rendering.
   * 
   * Navigation Items:
   * - Home: Patient dashboard with overview and quick actions
   * - Hospitals: Directory of hospitals with search and filtering
   * - Doctors: Doctor profiles with specialization and booking options
   * - Pharmacy: E-commerce platform for medication purchases
   * 
   * Note: AI Guide has been moved to a floating assistant widget for better UX
   */
  const navigation: NavItem[] = [
    { name: 'Home', href: '/patient', icon: '🏠' },
    { name: 'Hospitals', href: '/patient/hospitals', icon: '🏥' },
    { name: 'Doctors', href: '/patient/doctors', icon: '👨‍⚕️' },
    { name: 'Pharmacy', href: '/patient/pharmacy', icon: '💊' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 
        NAVIGATION HEADER SECTION
        
        Sticky header component that remains visible during scrolling.
        Contains branding, navigation menu, and authentication elements.
        
        Design Features:
        - White background with subtle shadow for depth
        - Sticky positioning (top-0 z-50) for persistent visibility
        - Responsive design that adapts to mobile and desktop screens
        - Border styling for visual separation from page content
      */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center transform hover:scale-110 transition-transform duration-200">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  AksabCare
                </h1>
                <p className="text-xs text-gray-500">Patient Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={{ pathname: item.href }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* 
              PROFILE ICON & AUTHENTICATION SECTION
              
              This section handles user authentication display with full responsive design.
              It shows different UI elements based on authentication state and screen size.
              
              Responsive Design Strategy:
              - Mobile: Shows compact profile icon or sign-in button
              - Desktop: Shows full profile with name or expanded sign-in button
              - All screen sizes maintain consistent functionality and accessibility
              
              Authentication States:
              1. Authenticated User:
                 - Mobile: Profile icon only (saves space)
                 - Desktop: Profile icon + user name
                 - Both link to profile page for account management
              
              2. Non-authenticated User:
                 - Mobile: Compact "Sign In" button
                 - Desktop: Full-width "Sign In" button with enhanced styling
                 - Both redirect to login page for authentication
              
              Design Features:
              - Gradient profile icon with smooth hover transitions
              - Consistent color scheme matching app branding
              - Touch-friendly sizing for mobile interactions
              - Accessibility support with proper titles and labels
            */}
            <div className="flex items-center space-x-4">
              {session && <NotificationsDropdown />}
              {session ? (
                /* 
                  AUTHENTICATED USER PROFILE DISPLAY
                  
                  Responsive profile button that adapts to screen size while maintaining
                  full functionality across all devices. The design prioritizes usability
                  and visual consistency.
                  
                  Mobile Design (< md breakpoint):
                  - Compact circular profile icon only
                  - Space-efficient for small screens
                  - Maintains touch-friendly 44px minimum touch target
                  
                  Desktop Design (>= md breakpoint):
                  - Profile icon + user name for better identification
                  - Expanded layout with better visual hierarchy
                  - Enhanced hover states for desktop interactions
                */
                <Link
                  href="/patient/profile"
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 min-w-0"
                  title="View Profile"
                >
                  {/* 
                    PROFILE ICON CONTAINER
                    
                    Circular gradient background with user icon that serves as the primary
                    visual identifier for the authenticated user. Consistent sizing across
                    all screen sizes ensures touch accessibility.
                    
                    Design Specifications:
                    - 32px (w-8 h-8) circle for optimal touch target size
                    - Blue to green gradient matching app color scheme
                    - White UserIcon with proper contrast for accessibility
                    - Smooth transitions for interactive feedback
                  */}
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* 
                    USER NAME DISPLAY - RESPONSIVE TEXT
                    
                    User name display that adapts to screen size for optimal space usage.
                    Uses responsive design patterns to show/hide based on available space.
                    
                    Mobile Strategy:
                    - Hidden on small screens (sm:hidden) to save horizontal space
                    - Profile icon alone is sufficient for mobile identification
                    
                    Desktop Strategy:
                    - Visible on medium screens and up (md:block)
                    - Provides clear user identification
                    - Truncates long names to prevent layout issues
                  */}
                  <span className="text-sm font-medium truncate hidden sm:block">
                    {session.user?.name || 'Profile'}
                  </span>
                </Link>
              ) : (
                /* 
                  NON-AUTHENTICATED USER SIGN-IN BUTTON
                  
                  Responsive sign-in button that adapts its size and styling based on
                  screen size while maintaining consistent functionality and branding.
                  
                  Mobile Design:
                  - Compact button with reduced padding for space efficiency
                  - Maintains minimum touch target size (44px) for accessibility
                  - Simplified styling to prevent visual clutter
                  
                  Desktop Design:
                  - Full-featured button with enhanced padding and styling
                  - Gradient background with hover effects
                  - Transform animations for engaging interactions
                  
                  Accessibility Features:
                  - Proper contrast ratios for text visibility
                  - Touch-friendly sizing on all devices
                  - Keyboard navigation support
                  - Screen reader compatible
                */
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 sm:px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-sm text-sm sm:text-base"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* 
              MOBILE MENU TOGGLE BUTTON
              
              Hamburger menu button that controls mobile navigation visibility.
              Only shown on mobile devices (md:hidden) to save space on larger screens.
              
              Functionality:
              - Toggles mobileMenuOpen state between true/false
              - Shows different icons based on menu state (hamburger vs X)
              - Provides smooth transitions and hover effects
              - Maintains accessibility standards for mobile interactions
              
              Design Features:
              - 44px minimum touch target (p-2 on 6x6 icon = 44px total)
              - Clear visual feedback on hover and interaction
              - Consistent gray color scheme matching header design
              - Smooth color transitions for professional feel
              
              Accessibility Considerations:
              - Proper button type for screen reader compatibility
              - Clear visual state changes for menu open/closed
              - Touch-friendly sizing for mobile devices
              - Keyboard navigation support through default button behavior
            */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                {mobileMenuOpen ? (
                  /* 
                    CLOSE MENU ICON (X)
                    
                    Displayed when mobile menu is open to indicate close action.
                    Uses an X/cross design to clearly communicate menu closure.
                    
                    SVG Specifications:
                    - 24x24 viewBox for consistent icon sizing
                    - Stroke-based design for crisp lines at all sizes
                    - currentColor inheritance for theme consistency
                    - Rounded line caps for softer appearance
                  */
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  /* 
                    HAMBURGER MENU ICON
                    
                    Classic three-line hamburger menu icon displayed when menu is closed.
                    Universal symbol for expandable navigation menu.
                    
                    SVG Specifications:
                    - Three horizontal lines representing menu items
                    - Consistent spacing and alignment
                    - Standard 24x24 viewBox for optimal rendering
                    - Stroke width of 2 for good visibility on mobile
                  */
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 
          MOBILE NAVIGATION MENU
          
          Collapsible mobile navigation that appears when the hamburger menu is toggled.
          Provides full navigation functionality and authentication options for mobile users.
          
          Design Features:
          - Slide-down animation with smooth transitions
          - Touch-friendly button sizes (minimum 44px touch targets)
          - Clear visual separation between navigation and auth sections
          - Consistent styling with desktop navigation
          
          Authentication Integration:
          - Shows appropriate authentication options based on user state
          - Profile link for authenticated users
          - Sign-in option for non-authenticated users
          - Automatic menu close on selection for better UX
        */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-2 space-y-1">
              {/* 
                MOBILE NAVIGATION LINKS
                
                List of main navigation items optimized for mobile interaction.
                Each item includes icon and text with proper touch targets.
              */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={{ pathname: item.href }}
                  className={`block px-3 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* 
                MOBILE AUTHENTICATION SECTION
                
                Dedicated section for authentication-related actions in mobile menu.
                Displays different options based on user authentication status.
                
                Authenticated User Options:
                - Profile management link with user identification
                - Clear visual indication of logged-in status
                
                Non-authenticated User Options:
                - Prominent sign-in button
                - Consistent styling with desktop sign-in button
              */}
              <div className="pt-3 border-t border-gray-200 mt-2">
                {session ? (
                  /* 
                    MOBILE PROFILE LINK FOR AUTHENTICATED USERS
                    
                    Provides access to profile management in mobile menu.
                    Includes user identification and consistent styling.
                  */
                  <Link
                    href="/patient/profile"
                    className="block px-3 py-3 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center space-x-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span>Profile ({session.user?.name || 'User'})</span>
                  </Link>
                ) : (
                  /* 
                    MOBILE SIGN-IN BUTTON FOR NON-AUTHENTICATED USERS
                    
                    Prominent sign-in option for users who need to authenticate.
                    Uses consistent branding and styling with desktop version.
                  */
                  <Link
                    href="/login"
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 
        MAIN CONTENT AREA
        
        Primary content container where individual page components are rendered.
        Uses flexbox layout to take up remaining viewport space after header.
        
        Layout Strategy:
        - flex-1: Expands to fill available space after sticky header
        - Contains all page-specific content and components
        - Maintains consistent spacing and layout across all pages
        - Inherits responsive behavior from parent container
        
        Content Rendering:
        - {children} prop renders the specific page component
        - Each page maintains its own internal layout and styling
        - Common layout elements (header, navigation) remain consistent
        - Page transitions are smooth due to layout preservation
      */}
      <main className="flex-1">{children}</main>
      
      {/* Floating AI Assistant Widget */}
      <FloatingAIAssistant />
    </div>
  )
}
