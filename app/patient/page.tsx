'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function PatientHomePage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    setIsVisible(true)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id
          setVisibleSections((prev) => ({
            ...prev,
            [sectionId]: entry.isIntersecting,
          }))
        })
      },
      { threshold: 0.1, rootMargin: '-50px' }
    )

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Rename id param to avoid unused-variable warning
  const setSectionRef = (section: string) => (el: HTMLElement | null) => {
    sectionRefs.current[section] = el
  }

  const services = [
    {
      title: 'Hospital Directory',
      description:
        'Find hospitals, compare services, check prices, and book appointments near you.',
      icon: '🏥',
      color: 'from-green-500 to-blue-500',
      href: '/patient/hospitals',
    },
    {
      title: 'Specialist Directory',
      description:
        'Connect with specialists in Nigeria and globally for virtual consultations.',
      icon: '👨‍⚕️',
      color: 'from-red-500 to-orange-500',
      href: '/patient/doctors',
    },
    {
      title: 'E-Pharmacy',
      description:
        'Order verified medications with drug scanner. Authentic drugs delivered to you.',
      icon: '💊',
      color: 'from-purple-500 to-pink-500',
      href: '/patient/pharmacy',
    },
  ]

  const features = [
    {
      title: 'Global Reach',
      description:
        'Serve patients locally in Nigeria and internationally through virtual consultations',
      icon: '🌍',
      color: 'from-blue-500 to-green-500',
    },
    {
      title: 'Secure Platform',
      description:
        'HIPAA-compliant telemedicine tools with end-to-end encryption for patient privacy',
      icon: '🔒',
      color: 'from-green-500 to-teal-500',
    },
    {
      title: 'Make Impact',
      description:
        'Bring healthcare to underserved communities and help bridge the healthcare gap',
      icon: '❤️',
      color: 'from-red-500 to-pink-500',
    },
  ]

  const whyChooseUs = [
    {
      title: 'AI-Powered Guidance',
      description:
        'Avoid the wrong doctor and save time & money with our intelligent health routing system. Get personalized recommendations based on your symptoms.',
      icon: '🧠',
      color: 'from-blue-500 to-purple-500',
    },
    {
      title: 'Verified Medications',
      description:
        'Purchase authentic drugs with our advanced verification scanner. Fight counterfeit medications and ensure your safety with every purchase.',
      icon: '✅',
      color: 'from-green-500 to-blue-500',
    },
    {
      title: 'Global Healthcare Access',
      description:
        'Consult with top specialists from Nigeria, India, Pakistan and beyond. Get world-class care from the comfort of your home.',
      icon: '🌐',
      color: 'from-orange-500 to-red-500',
    },
  ]

  const howItWorks = [
    {
      title: 'Describe Your Concern',
      description:
        'Tell our AI Health Guide about your symptoms or health concern. Get personalized guidance in seconds.',
      icon: '💬',
      color: 'from-blue-500 to-purple-500',
    },
    {
      title: 'Get Matched Instantly',
      description:
        'Our AI matches you to the right hospital, specialist, or service based on your specific needs and location.',
      icon: '⚡',
      color: 'from-green-500 to-blue-500',
    },
    {
      title: 'Connect & Get Care',
      description:
        'Book a physical appointment or start a virtual consultation immediately. Get prescriptions and verified medications.',
      icon: '❤️',
      color: 'from-red-500 to-pink-500',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-pulse">
              <span className="text-sm font-medium">
                🇳🇬 Nigeria’s #1 AI-Powered Healthcare Platform
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              The Right Care,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Right Now
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Get connected to the right healthcare services in seconds. Find hospitals,
              specialist doctors, or authentic medications. Expert healthcare from
              Nigeria and around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={{ pathname: '/patient/hospitals' }}
                className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-xl flex items-center space-x-2"
              >
                <span>🏥</span>
                <span>Find Hospitals</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                <span>📋</span>
                <span>Explore Services</span>
              </button>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-sm">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-yellow-400">⭐</span>
                <span>NAFDAC Verified</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-blue-400">👨‍⚕️</span>
                <span>Licensed Doctors</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-green-400">🔒</span>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full animate-bounce" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full animate-ping" />
      </section>

      {/* Services */}
      <section
        id="services"
        ref={setSectionRef('services')}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              visibleSections.services
                ? 'translate-y-0 opacity-100'
                : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600 text-sm font-medium mb-4">
              ⭐ Our Services
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Healthcare Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare solutions at your fingertips
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {services.map((service, idx) => (
              <div
                key={service.title}
                className={`group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-transparent ${
                  visibleSections.services ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 mb-6 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200`}
                >
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-200">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
                <Link
                  href={{ pathname: service.href }}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group-hover:translate-x-1 transition-transform duration-200"
                >
                  Explore <span className="ml-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Professionals */}
      <section
        id="professionals"
        ref={setSectionRef('professionals')}
        className="py-20 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              visibleSections.professionals
                ? 'translate-y-0 opacity-100'
                : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 animate-pulse">
              👨‍⚕️
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Are You a Medical Professional?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join our platform and help extend quality healthcare to patients across
              Nigeria and globally. Connect with patients through secure telemedicine
              consultations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {features.map((feature, idx) => (
                <div
                  key={feature.title}
                  className={`text-center transform transition-all duration-700 ${
                    visibleSections.professionals
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-10 opacity-0'
                  }`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div
                    className={`w-16 h-16 mb-4 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl mx-auto hover:scale-110 transition-transform duration-200`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() =>
                  router.push('/register' as const)
                }
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-xl flex items-center space-x-2"
              >
                <span>👨‍⚕️</span>
                <span>Join as a Doctor</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <Link
                href={{ pathname: '/login' }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Already a partner? Sign in here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        id="why-choose"
        ref={setSectionRef('why-choose')}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              visibleSections['why-choose']
                ? 'translate-y-0 opacity-100'
                : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-4">
              🏆 Why Choose Us
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AksabCare
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your trusted partner for quality, affordable healthcare
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((item, idx) => (
              <div
                key={item.title}
                className={`text-center transform transition-all duration-700 ${
                  visibleSections['why-choose']
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-10 opacity-0'
                }`}
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div
                  className={`w-20 h-20 mb-6 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center text-3xl mx-auto hover:scale-110 transition-transform duration-200`}
                >
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        ref={setSectionRef('how-it-works')}
        className="py-20 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              visibleSections['how-it-works']
                ? 'translate-y-0 opacity-100'
                : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-4">
              ⚡ Simple Process
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How AksabCare Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get the right healthcare in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {howItWorks.map((step, idx) => (
              <div
                key={step.title}
                className={`text-center transform transition-all duration-700 ${
                  visibleSections['how-it-works']
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-10 opacity-0'
                }`}
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div
                  className={`w-20 h-20 mb-6 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-3xl mx-auto relative hover:scale-110 transition-transform duration-200`}
                >
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        ref={setSectionRef('cta')}
        className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white"
      >
        <div
          className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transform transition-all duration-1000 ${
            visibleSections.cta ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of Nigerians getting better healthcare with AI guidance.
            Still not sure where to go? Let our AI Health Guide help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={{ pathname: '/patient/doctors' }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-xl flex items-center space-x-2"
            >
              <span>�‍⚕️</span>
              <span>Find Doctors</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
              <span>👤</span>
              <span>Create Free Account</span>
            </button>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span>Free to use</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span>No hidden charges</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">AksabCare NG</h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                AI-powered healthcare platform connecting Nigerians to quality medical
                services, specialists, and authentic medications.
              </p>
            </div>

            {/* Services */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold mb-6 text-white">Services</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={{ pathname: '/patient/hospitals' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Hospital Directory
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/patient/doctors' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Find Specialists
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/patient/pharmacy' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    E-Pharmacy
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/patient/verification' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Drug Verification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={{ pathname: '/help' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/contact' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/privacy' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/terms' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: '/disclaimer' }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Medical Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold mb-6 text-white">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-400">📧</span>
                  <a
                    href="mailto:support@aksabcare.ng"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    support@aksabcare.ng
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">📞</span>
                  <a
                    href="tel:+2348000000000"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    +234 800 AKSAB NG
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-orange-400">📍</span>
                  <span className="text-gray-400">Lagos, Nigeria</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 AksabCare NG. All rights reserved. | This platform does not
                provide medical diagnosis. Always consult healthcare professionals for
                medical advice.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
