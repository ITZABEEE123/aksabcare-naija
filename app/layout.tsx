// 🏥 AKSABHEALTH NG - ROOT LAYOUT COMPONENT
// ====================================================
// This is the foundational layout file that wraps around EVERY page in our application.
// Think of this as the "skeleton" or "frame" that holds all the pages together.
// Every time a user visits any page, this layout renders first, then the specific page content.

// Import necessary types and modules
import type { Metadata } from 'next'                    // Next.js type for page metadata (title, description, etc.)
import { Inter } from 'next/font/google'                // Google Fonts - Inter is a clean, modern font perfect for healthcare
import './globals.css'                                  // Global CSS styles that apply to the entire application
import { SessionProvider } from 'next-auth/react'      // Authentication provider that tracks user login state
import FloatingAIAssistant from '@/components/FloatingAIAssistant'  // AI Health Guide floating widget

// 🎨 FONT CONFIGURATION
// =====================
// Configure the Inter font from Google Fonts for our entire application
// Inter is chosen because:
// - Highly readable (important for medical information)
// - Professional appearance (builds trust with patients)
// - Supports multiple languages (good for Nigeria's linguistic diversity)
// - Optimized for screen reading (better user experience)
const inter = Inter({ 
  subsets: ['latin']  // Only load Latin characters to keep font file size smaller and faster
})

// 📄 PAGE METADATA CONFIGURATION
// ===============================
// This metadata appears in browser tabs, search engines, and social media shares
// It's crucial for SEO (Search Engine Optimization) and user experience
export const metadata: Metadata = {
  title: 'AksabHealth NG',                                    // Browser tab title and bookmark name
  description: 'AI-Powered Healthcare Platform for Nigeria', // Search engine description and social media preview
  // Additional metadata can be added here like:
  // - Open Graph tags for social media sharing
  // - Twitter Card metadata
  // - Favicon and app icons
  // - Viewport settings for mobile responsiveness
}

// 🏗️ ROOT LAYOUT COMPONENT
// =========================
// This is the main wrapper component that surrounds every page in our application.
// It's like the foundation of a house - everything else is built on top of it.
//
// The component receives 'children' as a prop, which represents the actual page content
// that changes when users navigate between different routes (pages).
export default function RootLayout({
  children,  // This is the dynamic content that changes based on the current page/route
}: {
  children: React.ReactNode  // TypeScript type definition: children can be any valid React content
}) {
  return (
    // 🌍 HTML ROOT ELEMENT
    // ====================
    // Set the language to English for accessibility and SEO
    // Screen readers and search engines use this to understand the content language
    <html lang="en">
      {/* 🎨 BODY ELEMENT WITH STYLING */}
      {/* ============================= */}
      {/* Apply the Inter font to the entire application */}
      <body className={inter.className}>
        {/* 🔐 AUTHENTICATION WRAPPER */}
        {/* ========================== */}
        {/* SessionProvider wraps our entire app to provide authentication context.
             This means ANY component in our app can check:
             - Is someone logged in?
             - Who is the current user?
             - What are their permissions?
             - Are they a doctor, patient, or admin?
             
             This is essential for our healthcare platform because:
             - Patients need to access their own medical records
             - Doctors need to see their own appointments
             - Admin users need special management permissions
             - We must protect sensitive medical information */}
        <SessionProvider>
          {/* 📱 DYNAMIC PAGE CONTENT */}
          {/* ======================= */}
          {/* This is where the magic happens! 
               The 'children' prop contains the actual page content that users see.
               When someone visits:
               - /login → Login page components render here
               - /patient/dashboard → Patient dashboard renders here  
               - /doctor/appointments → Doctor appointments page renders here
               - /payment/callback → Payment success/failure page renders here
               
               The layout (this file) stays the same, but children changes! */}
          {children}
          
          {/* 🤖 AI HEALTH ASSISTANT */}
          {/* ====================== */}
          {/* Beautiful floating AI assistant widget that appears on all pages
               Provides instant health guidance and support to all users */}
          <FloatingAIAssistant />
        </SessionProvider>
      </body>
    </html>
  )
}
