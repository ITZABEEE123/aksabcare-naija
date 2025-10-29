
// app/patient/ai-guide/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  XMarkIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  CpuChipIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { 
  ExclamationTriangleIcon as WarningSolid 
} from '@heroicons/react/24/solid'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Hospital, Doctor } from '@/types'

// Types for the AI Guide system
interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
  metadata?: {
    recommendation?: CareRecommendation
    quickReplies?: string[]
    isEmergency?: boolean
  }
}

interface CareRecommendation {
  level: 'emergency' | 'urgent_hospital' | 'telemedicine' | 'pharmacy' | 'self_care'
  confidence: number
  urgency: string
  reasoning: string[]
  recommendations: {
    immediate: string[]
    followUp: string[]
    watchFor: string[]
  }
  resources?: {
    hospitals?: Hospital[]
    specialists?: Doctor[]
    helpline?: string
  }
}

interface UserInput {
  symptoms: string[]
  duration: string
  severity: number
  age: number
  gender: string
  location: {
    state: string
    lga: string
  }
  context?: {
    isPregnant?: boolean
    chronicConditions?: string[]
    currentMedications?: string[]
  }
}

// Language support
const LANGUAGES = {
  english: {
    name: 'English',
    flag: '🇬🇧',
    greeting: "Hello! I'm your AI Health Guide. I'll help you understand what type of care might be right for your symptoms.",
    placeholder: "Describe your symptoms in detail...",
    emergency: "🚨 EMERGENCY: If you're experiencing a life-threatening emergency, call 199 or go to the nearest hospital immediately."
  },
  hausa: {
    name: 'Hausa',
    flag: '🇳🇬',
    greeting: "Sannu! Ni ne Jagorar Lafiya ta AI. Zan taimake ka fahimtar wane irin kulawa da zai dace da alamun da kake fuskanta.",
    placeholder: "Bayyana alamun da kake fuskanta dalla-dalla...",
    emergency: "🚨 GAGGAWA: Idan kana fuskanta matsala mai barazana ga rayuwa, kira 199 ko ka je asibiti mafi kusa nan take."
  },
  yoruba: {
    name: 'Yoruba',
    flag: '🇳🇬',
    greeting: "Bawo! Emi ni Amọna Ilera AI yin. Emi yoo ran yin lọwọ lati loye iru itọju ti o le tọ fun awọn ami aisan yin.",
    placeholder: "Ṣe apejuwe awọn ami aisan yin ni kikun...",
    emergency: "🚨 PAJAWIRI: Ti o ba n ni iriri pajawiri ti o le pa yin, pe 199 tabi lọ si ile-iwosan ti o sunmọ lẹsẹkẹsẹ."
  },
  igbo: {
    name: 'Igbo',
    flag: '🇳🇬',
    greeting: "Ndewo! Abụ m AI Health Guide gị. Aga m enyere gị aka ịghọta ụdị nlekọta nke nwere ike ịdị mma maka mgbaàmà gị.",
    placeholder: "Kọwaa mgbaàmà gị n'ụzọ zuru ezu...",
    emergency: "🚨 MBEREDE: Ọ bụrụ na ị na-enwe mberede nke nwere ike igbu mmadụ, kpọọ 199 ma ọ bụ gaa ụlọ ọgwụ kachasị nso ozugbo."
  }
}

// Quick symptom suggestions
const COMMON_SYMPTOMS = [
  { category: 'General', symptoms: ['Fever', 'Headache', 'Fatigue', 'Body aches'] },
  { category: 'Respiratory', symptoms: ['Cough', 'Shortness of breath', 'Sore throat', 'Chest pain'] },
  { category: 'Digestive', symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Stomach pain'] },
  { category: 'Pain', symptoms: ['Back pain', 'Joint pain', 'Muscle pain', 'Severe headache'] }
]

export default function AIGuidePage() {
  const { data: session } = useSession()
  const router = useRouter()

  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<keyof typeof LANGUAGES>('english')
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const [userInput, setUserInput] = useState<Partial<UserInput>>({})
  const [conversationStep, setConversationStep] = useState<'greeting' | 'symptoms' | 'details' | 'recommendation'>('greeting')
  const [showQuickReplies, setShowQuickReplies] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Initialize conversation
    const greeting: Message = {
      id: 'greeting',
      type: 'assistant',
      content: LANGUAGES[currentLanguage].greeting,
      timestamp: new Date()
    }

    const disclaimer: Message = {
      id: 'disclaimer',
      type: 'system',
      content: "⚠️ IMPORTANT: This tool provides health guidance only, not medical diagnosis. Always consult qualified healthcare professionals for medical decisions.",
      timestamp: new Date()
    }

    setMessages([disclaimer, greeting])
    setShowQuickReplies(true)
  }, [currentLanguage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowQuickReplies(false)

    try {
      // Show typing indicator
      const typingMessage: Message = {
        id: `typing-${Date.now()}`,
        type: 'assistant',
        content: 'Analyzing your symptoms...',
        timestamp: new Date(),
        isTyping: true
      }
      setMessages(prev => [...prev, typingMessage])

      // Call AI API
      const response = await fetch('/api/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationStep,
          userInput,
          language: currentLanguage,
          userId: session?.user?.id
        })
      })

      const data = await response.json()

      // Remove typing indicator
      setMessages(prev => prev.filter(m => !m.isTyping))

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: data.message,
          timestamp: new Date(),
          metadata: {
            recommendation: data.recommendation,
            quickReplies: data.quickReplies,
            isEmergency: data.isEmergency
          }
        }

        setMessages(prev => [...prev, assistantMessage])

        // Handle emergency cases
        if (data.isEmergency) {
          setShowEmergencyAlert(true)
        }

        // Update conversation state
        setConversationStep(data.nextStep || conversationStep)
        setUserInput(prev => ({ ...prev, ...data.userInput }))
        setShowQuickReplies(data.quickReplies && data.quickReplies.length > 0)
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: "I'm sorry, I'm having trouble processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(m => !m.isTyping).concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setInputValue(reply)
    setTimeout(() => handleSendMessage(), 100)
  }

  const handleSymptomSuggestion = (symptom: string) => {
    const currentValue = inputValue.trim()
    const newValue = currentValue 
      ? `${currentValue}, ${symptom.toLowerCase()}`
      : symptom.toLowerCase()
    setInputValue(newValue)
    inputRef.current?.focus()
  }

  const startOver = () => {
    setMessages([])
    setUserInput({})
    setConversationStep('greeting')
    setShowEmergencyAlert(false)
    setShowQuickReplies(false)

    // Re-initialize
    const greeting: Message = {
      id: 'greeting-new',
      type: 'assistant',
      content: LANGUAGES[currentLanguage].greeting,
      timestamp: new Date()
    }
    setMessages([greeting])
    setShowQuickReplies(true)
  }

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
          {!isUser && !isSystem && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600">AI Health Guide</span>
            </div>
          )}

          <div className={`rounded-2xl px-6 py-4 ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : isSystem
                ? 'bg-orange-50 border border-orange-200 text-orange-800'
                : 'bg-white shadow-lg border border-gray-200 text-gray-800'
          }`}>
            {message.isTyping ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm">{message.content}</span>
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                {/* Render recommendation if available */}
                {message.metadata?.recommendation && (
                  <div className="mt-4 space-y-3">
                    <RecommendationCard recommendation={message.metadata.recommendation} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-1 px-2">
            {message.timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {isUser && (
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center ml-3 order-2 flex-shrink-0">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </motion.div>
    )
  }

  const RecommendationCard = ({ recommendation }: { recommendation: CareRecommendation }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className={`p-4 rounded-xl border-2 ${
        recommendation.level === 'emergency' 
          ? 'bg-red-50 border-red-200'
          : recommendation.level === 'urgent_hospital'
            ? 'bg-orange-50 border-orange-200'
            : recommendation.level === 'telemedicine'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          recommendation.level === 'emergency' ? 'bg-red-500' :
          recommendation.level === 'urgent_hospital' ? 'bg-orange-500' :
          recommendation.level === 'telemedicine' ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {recommendation.level === 'emergency' ? (
            <ExclamationTriangleIcon className="w-6 h-6 text-white" />
          ) : recommendation.level === 'telemedicine' ? (
            <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-white" />
          ) : (
            <BuildingOffice2Icon className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 capitalize">
            {recommendation.level.replace('_', ' ')} Care
          </h4>
          <p className="text-sm text-gray-600">{recommendation.urgency}</p>
        </div>
      </div>

      {recommendation.recommendations.immediate.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-800 mb-2">Immediate Actions:</h5>
          <ul className="space-y-1">
            {recommendation.recommendations.immediate.map((action, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons based on recommendation level */}
      <div className="flex flex-wrap gap-2 mt-4">
        {recommendation.level === 'emergency' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('tel:199', '_self')}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
          >
            <PhoneIcon className="w-4 h-4" />
            <span>Call Emergency (199)</span>
          </motion.button>
        )}

        {(recommendation.level === 'urgent_hospital' || recommendation.level === 'emergency') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/patient/hospitals')}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
          >
            <MapPinIcon className="w-4 h-4" />
            <span>Find Hospital</span>
          </motion.button>
        )}

        {recommendation.level === 'telemedicine' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/patient/doctors')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Book Consultation</span>
          </motion.button>
        )}

        {recommendation.level === 'pharmacy' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/patient/pharmacy')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
          >
            <HeartIcon className="w-4 h-4" />
            <span>Visit E-Pharmacy</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/50 sticky top-0 z-40"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <CpuChipIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">AI Health Guide</h1>
                <p className="text-sm text-gray-600">Intelligent symptom assessment & care guidance</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value as keyof typeof LANGUAGES)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <option key={key} value={key} className="text-black bg-white">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startOver}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Start Over</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Emergency Alert */}
      <AnimatePresence>
        {showEmergencyAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="bg-red-600 text-white rounded-2xl p-4 shadow-2xl border border-red-500">
              <div className="flex items-start space-x-3">
                <WarningSolid className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">🚨 Emergency Detected</h3>
                  <p className="text-sm mb-4">{LANGUAGES[currentLanguage].emergency}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open('tel:199', '_self')}
                      className="bg-white text-red-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
                    >
                      Call 199
                    </button>
                    <button
                      onClick={() => router.push('/patient/hospitals')}
                      className="bg-red-700 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-red-800 transition-colors"
                    >
                      Find Hospital
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmergencyAlert(false)}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 min-h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px] space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <AnimatePresence>
            {showQuickReplies && messages[messages.length - 1]?.metadata?.quickReplies && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="px-6 pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].metadata!.quickReplies!.map((reply, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickReply(reply)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium border border-blue-200 transition-colors"
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Symptom Suggestions */}
          {conversationStep === 'symptoms' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 pb-4"
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Common symptoms:</h4>
              <div className="grid grid-cols-2 gap-4">
                {COMMON_SYMPTOMS.map((category) => (
                  <div key={category.category}>
                    <h5 className="text-xs font-medium text-gray-600 mb-2">{category.category}</h5>
                    <div className="flex flex-wrap gap-1">
                      {category.symptoms.map((symptom) => (
                        <button
                          key={symptom}
                          onClick={() => handleSymptomSuggestion(symptom)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs transition-colors"
                        >
                          {symptom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={LANGUAGES[currentLanguage].placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-black placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[60px] max-h-[120px]"
                  rows={1}
                />
                <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                  {inputValue.length}/500
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-medium transition-all ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                This AI provides guidance only, not medical diagnosis. For emergencies, call{' '}
                <button 
                  onClick={() => window.open('tel:199', '_self')}
                  className="text-red-600 font-semibold hover:underline"
                >
                  199
                </button>{' '}
                immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <h3 className="text-2xl font-bold">AksabCare NG</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                AI-powered healthcare platform connecting Nigerians to quality medical services, specialists, and authentic medications.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <span className="text-white font-bold">f</span>
                </button>
                <button className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <span className="text-white font-bold">t</span>
                </button>
                <button className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors">
                  <span className="text-white font-bold">w</span>
                </button>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-bold mb-6">Services</h4>
              <ul className="space-y-3">
                <li><Link href="/patient/hospitals" className="text-slate-300 hover:text-white transition-colors">Hospital Directory</Link></li>
                <li><Link href="/patient/hospitals" className="text-slate-300 hover:text-white transition-colors">Hospital Directory</Link></li>
                <li><Link href="/patient/doctors" className="text-slate-300 hover:text-white transition-colors">Find Specialists</Link></li>
                <li><Link href="/patient/pharmacy" className="text-slate-300 hover:text-white transition-colors">E-Pharmacy</Link></li>
                <li><span className="text-slate-300 cursor-not-allowed">Drug Verification</span></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><span className="text-slate-300 cursor-not-allowed">Help Center</span></li>
                <li><span className="text-slate-300 cursor-not-allowed">Contact Us</span></li>
                <li><span className="text-slate-300 cursor-not-allowed">Privacy Policy</span></li>
                <li><span className="text-slate-300 cursor-not-allowed">Terms of Service</span></li>
                <li><span className="text-slate-300 cursor-not-allowed">Medical Disclaimer</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold mb-6">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-400">📧</span>
                  <a href="mailto:support@aksabcare.ng" className="text-slate-300 hover:text-white transition-colors">
                    support@aksabcare.ng
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-400">📞</span>
                  <a href="tel:+2348000000000" className="text-slate-300 hover:text-white transition-colors">
                    +234 800 AKSAB NG
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-red-400">📍</span>
                  <span className="text-slate-300">Lagos, Nigeria</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300">All systems operational</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-12 pt-8">
            <div className="text-center text-slate-400 text-sm">
              © 2024 AksabCare NG. All rights reserved. | This platform does not provide medical diagnosis. Always consult healthcare professionals for medical advice.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
