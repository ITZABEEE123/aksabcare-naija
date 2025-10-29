// 🏠 AKSABHEALTH NG - HOMEPAGE / LANDING PAGE
// ===========================================
// This is the first page visitors see when they visit our healthcare platform.
// It's the "welcome mat" that introduces our services and converts visitors into users.
//
// 🎯 PAGE PURPOSES:
// - Showcase our healthcare services and features
// - Build trust with potential patients and doctors
// - Guide visitors to sign up or log in
// - Provide easy navigation to key areas
// - Demonstrate the value proposition of our platform
//
// 🏥 HEALTHCARE-SPECIFIC FEATURES HIGHLIGHTED:
// - Hospital directory for finding medical facilities
// - Doctor consultations and appointments
// - AI-powered health guidance and symptom checking
// - E-pharmacy for medication delivery
// - Secure video consultations
// - Safe payment processing for medical services

// Tell Next.js this component uses browser features (client-side interactivity)
'use client';

// 📦 IMPORT NECESSARY MODULES
// ===========================
import Link from 'next/link';                    // Next.js optimized navigation links
import { useState } from 'react';                // React state management for interactive features
import { useSession } from 'next-auth/react';   // Access to user authentication status
import { motion } from 'framer-motion';          // Smooth animations and transitions

// 🏠 MAIN LANDING PAGE COMPONENT
// ==============================
// This component creates the entire homepage experience
// It adapts based on whether someone is logged in or not
export default function LandingPage() {
  
  // 🔐 AUTHENTICATION STATE
  // =======================
  // Check if someone is currently logged in
  // This affects what navigation options and content we show
  const { data: session } = useSession();
  
  // 📱 MOBILE MENU STATE
  // ====================
  // Track whether the mobile hamburger menu is open or closed
  // Essential for responsive design on phones and tablets
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🌟 PLATFORM FEATURES SHOWCASE
  // =============================
  // Array of our key healthcare platform features
  // Each feature has an emoji icon, title, and description
  // This data drives the "Features" section of our homepage
  const features = [
    {
      icon: "🏥",                                                           // Visual identifier
      title: "Hospital Directory",                                         // Feature name
      description: "Find and connect with top-rated hospitals across Nigeria"  // Benefit explanation
    },
    {
      icon: "👨‍⚕️", 
      title: "Expert Doctors",
      description: "Access qualified doctors and specialists for consultations"
    },
    {
      icon: "🤖",
      title: "AI Health Guide", 
      description: "Get intelligent health guidance and symptom assessment"
    },
    {
      icon: "💊",
      title: "E-Pharmacy",
      description: "Order authentic medications with doorstep delivery"
    },
    {
      icon: "💬",
      title: "Video Consultations",
      description: "Consult with doctors remotely via secure video calls"
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description: "Safe and multiple payment options for all services"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Patient",
      content: "AksabCare helped me find a specialist when I needed it most. The AI guide was incredibly helpful!",
      rating: 5
    },
    {
      name: "Dr. Michael Adebayo",
      role: "Cardiologist",
      content: "The platform makes it easy to connect with patients and provide quality healthcare remotely.",
      rating: 5
    },
    {
      name: "Fatima Al-Hassan",
      role: "Patient",
      content: "Ordering medications through AksabCare is convenient and reliable. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
                <p className="text-xs text-gray-500">Healthcare Simplified</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Features
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                About
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Testimonials
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Contact
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {session ? (
                <Link 
                  href="/patient" 
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Get Started
                  </Link>
                </>
              )}
              
              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-4">
                <a href="#features" className="block text-gray-700 hover:text-blue-600 font-medium">Features</a>
                <a href="#about" className="block text-gray-700 hover:text-blue-600 font-medium">About</a>
                <a href="#testimonials" className="block text-gray-700 hover:text-blue-600 font-medium">Testimonials</a>
                <a href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium">Contact</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-8"
            >
              Your Health,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Simplified
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Connect with top hospitals, consult with expert doctors, get AI-powered health guidance, 
              and access authentic medications - all in one comprehensive platform.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Your Health Journey
              </Link>
              <Link 
                href="#features" 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Better Health</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform brings together all aspects of healthcare in one convenient location
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10,000+', label: 'Happy Patients' },
              { number: '500+', label: 'Expert Doctors' },
              { number: '50+', label: 'Partner Hospitals' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it - hear from the thousands who trust AksabCare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-500">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-green-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied users who trust AksabCare for their healthcare needs
          </p>
          <Link 
            href="/register" 
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg inline-block"
          >
            Get Started Today - It&apos;s Free!
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">AksabCare</h3>
                  <p className="text-sm text-gray-400">Healthcare Simplified</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing healthcare access across Nigeria through innovative technology and compassionate care.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                <li><span className="text-gray-400">Hospital Directory</span></li>
                <li><span className="text-gray-400">Doctor Consultations</span></li>
                <li><span className="text-gray-400">AI Health Guide</span></li>
                <li><span className="text-gray-400">E-Pharmacy</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Contact</h4>
              <ul className="space-y-3">
                <li className="text-gray-400">support@aksabcare.ng</li>
                <li className="text-gray-400">+234 800 AKSAB CARE</li>
                <li className="text-gray-400">Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 AksabCare. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}