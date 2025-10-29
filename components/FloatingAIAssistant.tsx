'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { 
  ExclamationTriangleIcon as WarningSolid 
} from '@heroicons/react/24/solid'
import { useSession } from 'next-auth/react'
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

const FloatingAIAssistant = () => {
  const { data: session } = useSession()

  // State management
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<keyof typeof LANGUAGES>('english')
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false)
  const [userInput, setUserInput] = useState<Partial<UserInput>>({})
  const [conversationStep, setConversationStep] = useState<'greeting' | 'symptoms' | 'details' | 'recommendation'>('greeting')
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const initializeConversation = useCallback(() => {
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

  // Initialize conversation when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeConversation()
    }
  }, [isOpen, messages.length, initializeConversation])

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
    setIsTyping(true)

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
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setInputValue(reply)
    setTimeout(() => handleSendMessage(), 100)
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
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
        <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
          {!isUser && !isSystem && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <CpuChipIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600">AI Health Guide</span>
            </div>
          )}

          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : isSystem
                ? 'bg-orange-50 border border-orange-200 text-orange-800'
                : 'bg-white shadow-md border border-gray-200 text-gray-800'
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
                  <div className="mt-3">
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
          <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center ml-3 order-2 flex-shrink-0">
            <UserCircleIcon className="w-4 h-4 text-white" />
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
      className={`p-3 rounded-xl border-2 mt-3 ${
        recommendation.level === 'emergency' 
          ? 'bg-red-50 border-red-200'
          : recommendation.level === 'urgent_hospital'
            ? 'bg-orange-50 border-orange-200'
            : recommendation.level === 'telemedicine'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          recommendation.level === 'emergency' ? 'bg-red-500' :
          recommendation.level === 'urgent_hospital' ? 'bg-orange-500' :
          recommendation.level === 'telemedicine' ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {recommendation.level === 'emergency' ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
          ) : recommendation.level === 'telemedicine' ? (
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-white" />
          ) : (
            <BuildingOffice2Icon className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm capitalize">
            {recommendation.level.replace('_', ' ')} Care
          </h4>
          <p className="text-xs text-gray-600">{recommendation.urgency}</p>
        </div>
      </div>

      {recommendation.recommendations.immediate.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-700">Immediate Actions:</h5>
          <ul className="space-y-1">
            {recommendation.recommendations.immediate.map((action, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs">
                <CheckCircleIcon className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 0.6
            }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              
              {/* Main button */}
              <motion.button
                onClick={toggleChat}
                className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-purple-500/25 transition-all duration-300"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <CpuChipIcon className="w-8 h-8" />
                </motion.div>

                {/* Notification badge */}
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </motion.button>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-400 rounded-full"
                    animate={{
                      y: [-20, -40, -20],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: `${50 + (Math.random() - 0.5) * 30}%`,
                      top: `${50 + (Math.random() - 0.5) * 30}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4
            }}
            className="fixed z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ 
              bottom: '1.5rem',
              right: '1.5rem',
              height: 'min(26rem, calc(100vh - 8rem))',
              maxHeight: 'calc(100vh - 8rem)',
              top: 'auto'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CpuChipIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Health Guide</h3>
                    <p className="text-sm opacity-90">
                      {isTyping ? 'Thinking...' : 'Here to help you'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Language selector */}
                  <select
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value as keyof typeof LANGUAGES)}
                    className="bg-white/20 backdrop-blur-sm text-white text-xs rounded-lg px-2 py-1 border-none outline-none"
                  >
                    {Object.entries(LANGUAGES).map(([key, lang]) => (
                      <option key={key} value={key} className="text-gray-800">
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  
                  <motion.button
                    onClick={toggleChat}
                    className="w-9 h-9 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-colors border border-white/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Close AI Assistant"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-0">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickReplies && (
              <div className="p-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {['I have a headache', 'Feeling sick', 'Need a doctor', 'Emergency help'].map((reply) => (
                    <motion.button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
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
                    className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    rows={1}
                    disabled={isLoading}
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Alert */}
      <AnimatePresence>
        {showEmergencyAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 bg-red-600 text-white p-4 rounded-xl shadow-2xl max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <WarningSolid className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm mb-1">EMERGENCY DETECTED</h4>
                <p className="text-sm opacity-90">{LANGUAGES[currentLanguage].emergency}</p>
                <button
                  onClick={() => setShowEmergencyAlert(false)}
                  className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingAIAssistant