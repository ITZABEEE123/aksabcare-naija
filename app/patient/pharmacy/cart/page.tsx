// File: app/patient/pharmacy/cart/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCartIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BeakerIcon,
  TagIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  HeartIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid, HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

interface CartItem {
  id: string
  drugId: string
  inventoryId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  drug: {
    id: string
    name: string
    brandName: string | null
    manufacturer: string
    strength: string
    dosageForm: string
    images: string[]
    requiresPrescription: boolean
    category: string
    nafdacNumber: string
  }
  pharmacy: {
    id: string
    name: string
    isVerified: boolean
    phone: string
    address?: {
      street: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  }
}

interface DeliveryAddress {
  fullName: string
  street: string
  city: string
  state: string
  postalCode: string
  phone: string
  instructions?: string
  isDefault?: boolean
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT-Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const DELIVERY_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: '3-5 business days',
    price: 2500,
    icon: TruckIcon,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: '1-2 business days',
    price: 5000,
    icon: BoltIcon,
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'same-day',
    name: 'Same Day Delivery',
    description: 'Within 6 hours',
    price: 8000,
    icon: FireIcon,
    gradient: 'from-purple-500 to-pink-500'
  }
]

export default function PharmacyCartPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment' | 'success'>('cart')
  
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    instructions: '',
    isDefault: false
  })

  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('standard')
  const [orderId, setOrderId] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)

  // Load cart and favorites from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('pharmacy-cart')
    const savedFavorites = localStorage.getItem('pharmacy-favorites')
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Transform cart items to match expected format
        const transformedCart = parsedCart.map((item: {
          drugId: string
          inventoryId: string
          quantity: number
          price: number
          drug: {
            id: string
            name: string
            genericName?: string
            category: string
            pharmacies?: Array<{
              pharmacyId: string
              pharmacyName: string
              isVerified: boolean
              phone: string
              address?: {
                street: string
                city: string
                state: string
                postalCode: string
                country: string
              }
            }>
          }
        }) => ({
          id: `cart-${item.drugId}-${item.inventoryId}`,
          drugId: item.drugId,
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          drug: item.drug,
          pharmacy: {
            id: item.drug.pharmacies?.[0]?.pharmacyId || 'pharm_1',
            name: item.drug.pharmacies?.[0]?.pharmacyName || 'AksabCare Central Pharmacy',
            isVerified: item.drug.pharmacies?.[0]?.isVerified || true,
            phone: item.drug.pharmacies?.[0]?.phone || '+234-800-PHARMACY',
            address: item.drug.pharmacies?.[0]?.address
          }
        }))
        setCartItems(transformedCart)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
    
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
    
    setLoading(false)
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    if (cartItems.length > 0) {
      const cartForStorage = cartItems.map(item => ({
        drugId: item.drugId,
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        price: item.unitPrice,
        drug: item.drug
      }))
      localStorage.setItem('pharmacy-cart', JSON.stringify(cartForStorage))
    } else {
      localStorage.removeItem('pharmacy-cart')
    }
  }, [cartItems])

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const selectedDelivery = DELIVERY_OPTIONS.find(opt => opt.id === selectedDeliveryOption)
  const deliveryFee = selectedDelivery?.price || 0
  const discount = promoDiscount
  const total = subtotal + deliveryFee - discount

  // Update quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, newQuantity),
              totalPrice: item.unitPrice * Math.max(1, newQuantity)
            }
          : item
      )
    )
  }

  // Remove item
  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('pharmacy-cart')
  }

  // Add to favorites
  const toggleFavorite = (drugId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(drugId)) {
      newFavorites.delete(drugId)
    } else {
      newFavorites.add(drugId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('pharmacy-favorites', JSON.stringify(Array.from(newFavorites)))
  }

  // Apply promo code
  const applyPromoCode = () => {
    // Mock promo code logic
    const validCodes = {
      'FIRST10': 0.1,
      'HEALTH20': 0.2,
      'SAVE500': 500
    }
    
    if (validCodes[promoCode as keyof typeof validCodes]) {
      const discount = validCodes[promoCode as keyof typeof validCodes]
      if (discount < 1) {
        setPromoDiscount(subtotal * discount)
      } else {
        setPromoDiscount(discount)
      }
    }
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (!session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/auth/signin' as any)
      return
    }

    if (cartItems.length === 0) return

    setIsCheckingOut(true)
    try {
      const orderData = {
        items: cartItems.map(item => ({
          drugId: item.drugId,
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        deliveryAddress: deliveryAddress,
        deliveryOption: selectedDeliveryOption,
        totalAmount: total,
        promoCode: promoCode || undefined,
        discount: discount
      }

      const response = await fetch('/api/pharmacy/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        setOrderId(result.data.orderId || 'ORDER-' + Date.now())
        setStep('success')
        clearCart()
      } else {
        throw new Error(result.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-semibold">Loading your cart...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/50 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => step === 'cart' ? router.back() : setStep('cart')}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </motion.button>
              
              <div>
                <h1 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 font-medium">
                  {step === 'cart' && `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart`}
                  {step === 'delivery' && 'Delivery Information'}
                  {step === 'payment' && 'Payment & Review'}
                  {step === 'success' && 'Order Confirmed!'}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-4">
              {['cart', 'delivery', 'payment', 'success'].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step === stepName
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                        : index < ['cart', 'delivery', 'payment', 'success'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step === stepName ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        {index + 1}
                      </motion.div>
                    ) : index < ['cart', 'delivery', 'payment', 'success'].indexOf(step) ? (
                      <CheckCircleSolid className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                  {index < 3 && (
                    <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                      index < ['cart', 'delivery', 'payment', 'success'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {cartItems.length > 0 && step === 'cart' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearCart}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                Clear Cart
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Cart Items */}
          {step === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {cartItems.length === 0 ? (
                // Empty Cart
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-40 h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                  >
                    <ShoppingCartIcon className="w-20 h-20 text-white" />
                  </motion.div>
                  
                  <h2 className="text-4xl font-black text-gray-900 mb-4">Your cart is empty</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    Looks like you haven&apos;t added any medications to your cart yet. Browse our pharmacy to find what you need.
                  </p>
                  
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/patient/pharmacy')}
                      className="px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl"
                    >
                      Browse Medications
                    </motion.button>
                    
                    <div className="flex justify-center space-x-8 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                        <span>60+ Verified Drugs</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TruckIcon className="w-5 h-5 text-blue-500" />
                        <span>Fast Delivery</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                        <span>NAFDAC Approved</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Cart with Items
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Cart Items */}
                  <div className="xl:col-span-2 space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Premium Selection</h3>
                          <p className="text-sm text-gray-600">All medications are NAFDAC verified & pharmacy-grade</p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-sm text-gray-600">Total Items</p>
                        <p className="text-2xl font-black text-gray-900">{cartItems.length}</p>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {cartItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, scale: 0.9 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group"
                        >
                          <div className="flex items-start space-x-6">
                            {/* Drug Visual */}
                            <div className="relative flex-shrink-0">
                              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <BeakerIcon className="w-12 h-12 text-blue-600" />
                              </div>
                              
                              {/* Category Badge */}
                              <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                                {item.drug.category}
                              </div>
                            </div>

                            {/* Drug Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {item.drug.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="text-gray-600">
                                      <span className="font-semibold">{item.drug.brandName}</span> • {item.drug.manufacturer}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                                      {item.drug.strength} • {item.drug.dosageForm}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleFavorite(item.drugId)}
                                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                                  >
                                    {favorites.has(item.drugId) ? (
                                      <HeartSolid className="w-6 h-6 text-red-500" />
                                    ) : (
                                      <HeartIcon className="w-6 h-6 text-gray-400 hover:text-red-400" />
                                    )}
                                  </motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  >
                                    <TrashIcon className="w-6 h-6" />
                                  </motion.button>
                                </div>
                              </div>

                              {/* Pharmacy Info */}
                              <div className="flex items-center space-x-3 mb-6">
                                <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-gray-700 font-medium">{item.pharmacy.name}</span>
                                {item.pharmacy.isVerified && (
                                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                    <ShieldCheckIcon className="w-3 h-3" />
                                    <span>Verified</span>
                                  </div>
                                )}
                                {item.drug.requiresPrescription && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                                    ℞ Prescription Required
                                  </span>
                                )}
                              </div>

                              {/* Quantity and Price Controls */}
                              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                                  <div className="flex items-center space-x-3">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                      <MinusIcon className="w-5 h-5 text-gray-600" />
                                    </motion.button>
                                    
                                    <span className="text-xl font-black text-gray-900 w-12 text-center bg-white rounded-lg py-2 shadow-md border border-gray-200">
                                      {item.quantity}
                                    </span>
                                    
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                      <PlusIcon className="w-5 h-5 text-gray-600" />
                                    </motion.button>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm text-gray-600 mb-1">
                                    {formatCurrency(item.unitPrice)} × {item.quantity}
                                  </p>
                                  <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {formatCurrency(item.totalPrice)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Order Summary Sidebar */}
                  <div className="xl:col-span-1">
                    <div className="sticky top-24 space-y-6">
                      {/* Promo Code */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/50"
                      >
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                          <TagIcon className="w-6 h-6 text-green-600" />
                          <span>Promo Code</span>
                        </h3>
                        
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            placeholder="Enter code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={applyPromoCode}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                          >
                            Apply
                          </motion.button>
                        </div>
                        
                        {discount > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-3 p-3 bg-green-50 rounded-xl flex items-center space-x-2"
                          >
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 font-semibold">
                              {formatCurrency(discount)} discount applied!
                            </span>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Order Summary */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50"
                      >
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                          <CreditCardIcon className="w-6 h-6 text-purple-600" />
                          <span>Order Summary</span>
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Subtotal ({cartItems.length} items):</span>
                            <span className="font-semibold text-lg">{formatCurrency(subtotal)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Standard Delivery:</span>
                            <span className="font-semibold text-lg">{formatCurrency(DELIVERY_OPTIONS[0].price)}</span>
                          </div>
                          
                          {discount > 0 && (
                            <div className="flex items-center justify-between text-green-600">
                              <span>Discount ({promoCode}):</span>
                              <span className="font-semibold text-lg">-{formatCurrency(discount)}</span>
                            </div>
                          )}
                          
                          <hr className="border-gray-200" />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">Total:</span>
                            <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <TruckIcon className="w-4 h-4" />
                            <span>Free delivery on orders over ₦10,000</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>Secure payment & verified medications</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            <span>Same-day delivery available</span>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setStep('delivery')}
                          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl flex items-center justify-center space-x-3"
                        >
                          <CreditCardIcon className="w-6 h-6" />
                          <span>Proceed to Checkout</span>
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Delivery Details */}
          {step === 'delivery' && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Delivery Address Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
                      <MapPinIcon className="w-8 h-8 text-blue-600" />
                      <span>Delivery Address</span>
                    </h2>
                    <p className="text-gray-600">Where should we deliver your medications?</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={deliveryAddress.fullName}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address *</label>
                      <input
                        type="text"
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                        placeholder="Enter street address"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                        <select
                          value={deliveryAddress.state}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                          required
                        >
                          <option value="">Select state</option>
                          {NIGERIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          value={deliveryAddress.postalCode}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                          placeholder="Enter postal code"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={deliveryAddress.phone}
                          onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                          placeholder="+234 xxx xxx xxxx"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Instructions</label>
                      <textarea
                        value={deliveryAddress.instructions}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
                        rows={3}
                        placeholder="Any special delivery instructions..."
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="defaultAddress"
                        checked={deliveryAddress.isDefault}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="defaultAddress" className="text-sm font-medium text-gray-700">
                        Save as default address
                      </label>
                    </div>
                  </div>
                </motion.div>

                {/* Delivery Options */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                      <TruckIcon className="w-6 h-6 text-green-600" />
                      <span>Delivery Options</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {DELIVERY_OPTIONS.map((option) => (
                        <motion.div
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                            selectedDeliveryOption === option.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          onClick={() => setSelectedDeliveryOption(option.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 bg-gradient-to-r ${option.gradient} rounded-xl flex items-center justify-center`}>
                                <option.icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{option.name}</h4>
                                <p className="text-sm text-gray-600">{option.description}</p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xl font-black text-gray-900">
                                {formatCurrency(option.price)}
                              </p>
                              {selectedDeliveryOption === option.id && (
                                <div className="flex items-center justify-end mt-1">
                                  <CheckCircleSolid className="w-5 h-5 text-blue-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Order Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Delivery ({selectedDelivery?.name}):</span>
                        <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-green-600">
                          <span>Discount:</span>
                          <span className="font-semibold">-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <hr />
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep('cart')}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Back to Cart
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckout}
                        disabled={!deliveryAddress.fullName || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.phone || isCheckingOut}
                        className="flex-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckingOut ? 'Processing...' : 'Place Order'}
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2 
                }}
                className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
              >
                <CheckCircleSolid className="w-16 h-16 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-4xl font-black text-gray-900 mb-4">Order Placed Successfully! 🎉</h2>
                <p className="text-gray-600 mb-2 text-lg">Your order <span className="font-bold text-blue-600">#{orderId}</span> has been confirmed.</p>
                <p className="text-gray-600 mb-8 text-lg">You&apos;ll receive SMS updates and tracking details shortly.</p>

                <div className="flex flex-wrap justify-center gap-6 mb-12 max-w-2xl mx-auto">
                  <div className="flex items-center space-x-3 p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">{selectedDelivery?.description || '3-5 business days'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <ShieldCheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Order Total</p>
                      <p className="text-sm text-gray-600">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <PhoneIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">Support</p>
                      <p className="text-sm text-gray-600">+234-800-AKSAB-NG</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      router.push('/patient/orders' as any)
                    }}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl"
                  >
                    Track Your Order
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/patient/pharmacy')}
                    className="px-10 py-4 bg-white/80 backdrop-blur-lg text-gray-700 rounded-2xl font-bold text-lg hover:bg-white transition-all duration-300 shadow-xl border border-white/50"
                  >
                    Continue Shopping
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Bottom Navigation */}
      <EnhancedBottomNavigation />
    </div>
  )
}

// Enhanced Bottom Navigation Component
function EnhancedBottomNavigation() {
  const router = useRouter()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/patient', gradient: 'from-blue-500 to-cyan-500' },
    { icon: '👨‍⚕️', label: 'Doctors', path: '/patient/doctors', gradient: 'from-green-500 to-emerald-500' },
    { icon: '🏥', label: 'Hospitals', path: '/patient/hospitals', gradient: 'from-purple-500 to-pink-500' },
    { icon: '💊', label: 'Pharmacy', path: '/patient/pharmacy', gradient: 'from-orange-500 to-red-500' },
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div className="bg-white/90 backdrop-blur-2xl border-t border-white/50 shadow-2xl">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push(item.path as any)
                }}
                className={`flex flex-col items-center space-y-1 px-6 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  currentPath.includes(item.path)
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-110`
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {currentPath.includes(item.path) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                  />
                )}
                <span className="relative text-2xl">{item.icon}</span>
                <span className="relative text-xs font-bold">{item.label}</span>
                {currentPath.includes(item.path) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
