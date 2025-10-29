
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingCartIcon,
  HeartIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

// Drug category data with icons and colors
const DRUG_CATEGORIES = [
  { 
    key: 'ANTIBIOTIC', 
    name: 'Antibiotics', 
    icon: '🧬', 
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  { 
    key: 'ANALGESIC', 
    name: 'Pain Relief', 
    icon: '💊', 
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  { 
    key: 'ANTIHYPERTENSIVE', 
    name: 'Blood Pressure', 
    icon: '❤️', 
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  { 
    key: 'ANTIDIABETIC', 
    name: 'Diabetes', 
    icon: '🩺', 
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  { 
    key: 'ANTIMALARIAL', 
    name: 'Malaria', 
    icon: '🦟', 
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700'
  },
  { 
    key: 'VITAMIN', 
    name: 'Vitamins', 
    icon: '🌟', 
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700'
  },
  { 
    key: 'SUPPLEMENT', 
    name: 'Supplements', 
    icon: '💪', 
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  { 
    key: 'CARDIOVASCULAR', 
    name: 'Heart Care', 
    icon: '💓', 
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700'
  },
  { 
    key: 'RESPIRATORY', 
    name: 'Respiratory', 
    icon: '🫁', 
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700'
  }
]

interface Drug {
  id: string
  name: string
  genericName?: string
  brandName?: string
  manufacturer: string
  strength: string
  dosageForm: string
  category: string
  requiresPrescription: boolean
  nafdacNumber: string
  activeIngredients: string[]
  description?: string
  sideEffects?: string
  contraindications?: string
  images?: string[]
}

interface PharmacyInfo {
  id: string
  name: string
  isVerified: boolean
  phone: string
  address?: {
    street: string
    city: string
    state: string
  }
  quantity: number
  price: number
  batchNumber: string
  expiryDate: string
  inventoryId: string
}

interface DrugWithPharmacies extends Drug {
  pharmacies: PharmacyInfo[]
}

interface CartItem {
  drugId: string
  inventoryId: string
  quantity: number
  price: number
  drug: DrugWithPharmacies
}

export default function PharmacyPage() {
  const [drugs, setDrugs] = useState<DrugWithPharmacies[]>([])
  const [filteredDrugs, setFilteredDrugs] = useState<DrugWithPharmacies[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDrug, setSelectedDrug] = useState<DrugWithPharmacies | null>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyInfo | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<CartItem[]>([])

  // Carousel scroll refs
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  // Load data on component mount
  useEffect(() => {
    fetchDrugs()
    loadFavorites()
    loadCart()
  }, [])

  // Filter drugs based on search and category
  useEffect(() => {
    let filtered = drugs

    if (searchTerm) {
      filtered = filtered.filter(drug =>
        drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.activeIngredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter(drug => drug.category === selectedCategory)
    }

    // Sort drugs with safety checks for pharmacy data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price-low':
          // Get minimum price for each drug, handling empty pharmacy arrays
          const aMinPrice = a.pharmacies && a.pharmacies.length > 0 
            ? Math.min(...a.pharmacies.map(p => p.price)) 
            : Number.MAX_SAFE_INTEGER
          const bMinPrice = b.pharmacies && b.pharmacies.length > 0 
            ? Math.min(...b.pharmacies.map(p => p.price)) 
            : Number.MAX_SAFE_INTEGER
          return aMinPrice - bMinPrice
        case 'price-high':
          // Get maximum price for each drug, handling empty pharmacy arrays
          const aMaxPrice = a.pharmacies && a.pharmacies.length > 0 
            ? Math.max(...a.pharmacies.map(p => p.price)) 
            : 0
          const bMaxPrice = b.pharmacies && b.pharmacies.length > 0 
            ? Math.max(...b.pharmacies.map(p => p.price)) 
            : 0
          return bMaxPrice - aMaxPrice
        case 'manufacturer':
          return a.manufacturer.localeCompare(b.manufacturer)
        default:
          return 0
      }
    })

    setFilteredDrugs(filtered)
  }, [drugs, searchTerm, selectedCategory, sortBy])

  const fetchDrugs = async () => {
    try {
      console.log('Fetching drugs from API...')
      const response = await fetch('/api/drugs')
      const data = await response.json()
      
      console.log('API Response:', data)
      console.log('Response status:', response.status)

      if (response.ok && Array.isArray(data)) {
        console.log('Setting drugs:', data.length, 'drugs found')
        setDrugs(data)
      } else {
        console.error('Failed to fetch drugs or invalid format:', data)
        setDrugs([])
      }
    } catch (error) {
      console.error('Error fetching drugs:', error)
      setDrugs([])
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem('pharmacy-favorites')
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
  }

  const loadCart = () => {
    const saved = localStorage.getItem('pharmacy-cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }

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

  const addToCart = (drug: DrugWithPharmacies, pharmacy: PharmacyInfo, qty: number) => {
    const cartItem: CartItem = {
      drugId: drug.id,
      inventoryId: pharmacy.inventoryId,
      quantity: qty,
      price: pharmacy.price,
      drug: {
        ...drug,
        pharmacies: [pharmacy]
      }
    }

    const updatedCart = [...cart]
    const existingIndex = updatedCart.findIndex(
      item => item.drugId === drug.id && item.inventoryId === cartItem.inventoryId
    )

    if (existingIndex >= 0) {
      updatedCart[existingIndex].quantity += qty
    } else {
      updatedCart.push(cartItem)
    }

    setCart(updatedCart)
    localStorage.setItem('pharmacy-cart', JSON.stringify(updatedCart))

    // Close modal
    setSelectedDrug(null)
    setSelectedPharmacy(null)
    setQuantity(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Carousel scroll functions
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
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
          <p className="text-gray-600 font-semibold">Loading medications...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col space-y-6">
            {/* Title and Cart */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  AksabCare Pharmacy
                </h1>
                <p className="text-gray-600 font-medium">Authentic medications delivered to your doorstep</p>
              </div>

              {cart.length > 0 && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <button 
                    onClick={() => window.location.href = '/patient/pharmacy/cart'}
                    className="flex items-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  >
                    <ShoppingCartIcon className="w-6 h-6" />
                    <span>View Cart ({cart.length})</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for medications (e.g., Paracetamol, Amlodipine, Vitamins)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium text-black placeholder:text-gray-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drug Categories Carousel */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative">
            {/* Scroll Buttons */}
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>

            {/* Categories Container */}
            <div
              ref={categoryScrollRef}
              className="flex items-center space-x-4 overflow-x-auto scrollbar-hide py-2 px-14 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Categories Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('')}
                className={`flex-shrink-0 flex items-center space-x-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 min-w-max ${
                  selectedCategory === ''
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                }`}
              >
                <span className="text-2xl">🏥</span>
                <span className="whitespace-nowrap">All Medications</span>
              </motion.button>

              {/* Category Buttons */}
              {DRUG_CATEGORIES.map((category) => (
                <motion.button
                  key={category.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex-shrink-0 flex items-center space-x-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 min-w-max ${
                    selectedCategory === category.key
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : `${category.bgColor} ${category.textColor} hover:shadow-md border border-gray-200`
                  }`}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="whitespace-nowrap">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-black">
              Showing {filteredDrugs.length} of {drugs.length} medications
            </span>
            {(selectedCategory || searchTerm) && (
              <div className="flex items-center space-x-2">
                {selectedCategory && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                    {DRUG_CATEGORIES.find(c => c.key === selectedCategory)?.name}
                  </span>
                )}
                {searchTerm && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    &quot;{searchTerm}&quot;
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-black">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-black"
            >
              <option value="name" className="text-black">Name A-Z</option>
              <option value="price-low" className="text-black">Price: Low to High</option>
              <option value="price-high" className="text-black">Price: High to Low</option>
              <option value="manufacturer" className="text-black">Manufacturer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drugs Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredDrugs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-8">
              <MagnifyingGlassIcon className="w-16 h-16 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">No medications found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We couldn&apos;t find any medications matching your criteria. Try adjusting your search or filters.
            </p>

            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredDrugs.map((drug, index) => (
              <motion.div
                key={drug.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Drug Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {drug.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {drug.brandName} • {drug.manufacturer}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleFavorite(drug.id)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    {favorites.has(drug.id) ? (
                      <HeartSolid className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-400" />
                    )}
                  </button>
                </div>

                {/* Drug Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Generic:</span>
                    <span className="text-sm font-semibold text-gray-900">{drug.genericName || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">NAFDAC:</span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{drug.nafdacNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Strength:</span>
                    <span className="text-sm font-semibold text-blue-600">{drug.strength}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Form:</span>
                    <span className="text-sm font-semibold text-gray-900">{drug.dosageForm}</span>
                  </div>
                </div>

                {/* Active Ingredients */}
                {drug.activeIngredients && drug.activeIngredients.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Active Ingredients:</p>
                    <p className="text-xs text-gray-700 line-clamp-2">{drug.activeIngredients.join(', ')}</p>
                  </div>
                )}

                {/* Description */}
                {drug.description && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-700 line-clamp-3">{drug.description}</p>
                  </div>
                )}

                {/* Side Effects */}
                {drug.sideEffects && (
                  <div className="mb-4">
                    <p className="text-xs text-amber-600 font-semibold mb-1">Side Effects:</p>
                    <p className="text-xs text-amber-700 line-clamp-2">{drug.sideEffects}</p>
                  </div>
                )}

                {/* Contraindications */}
                {drug.contraindications && (
                  <div className="mb-4">
                    <p className="text-xs text-red-600 font-semibold mb-1">Contraindications:</p>
                    <p className="text-xs text-red-700 line-clamp-2">{drug.contraindications}</p>
                  </div>
                )}

                {/* Pharmacies */}
                {drug.pharmacies && drug.pharmacies.length > 0 ? (
                  <div className="space-y-3">
                    {drug.pharmacies.slice(0, 2).map((pharmacy) => (
                      <div key={pharmacy.id} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{pharmacy.name}</span>
                            {pharmacy.isVerified && (
                              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-semibold text-green-600">{pharmacy.quantity} units in stock</span>
                          </div>

                          <div className="text-xs text-gray-600">
                            <span>Batch: {pharmacy.batchNumber} • Expires: {new Date(pharmacy.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-black text-green-600">{formatCurrency(pharmacy.price)}</p>
                            <p className="text-xs text-gray-500">per unit</p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedDrug(drug)
                              setSelectedPharmacy(pharmacy)
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}

                    {drug.pharmacies.length > 2 && (
                      <button
                        onClick={() => setSelectedDrug(drug)}
                        className="w-full py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors text-sm"
                      >
                        View all {drug.pharmacies.length} pharmacies
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <p className="text-gray-500 text-sm">Currently out of stock</p>
                  </div>
                )}

                {/* Prescription Required Badge */}
                {drug.requiresPrescription && (
                  <div className="mt-4 flex items-center justify-center">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                      ℞ Prescription Required
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Drug Detail Modal */}
      <AnimatePresence>
        {selectedDrug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedDrug(null)
              setSelectedPharmacy(null)
              setQuantity(1)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedDrug.name}</h2>
                  <p className="text-gray-600">
                    {selectedDrug.brandName} • {selectedDrug.manufacturer}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDrug(null)
                    setSelectedPharmacy(null)
                    setQuantity(1)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Drug Information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Generic Name:</label>
                  <p className="text-gray-900">{selectedDrug.genericName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">NAFDAC Number:</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedDrug.nafdacNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Strength:</label>
                  <p className="text-blue-600 font-semibold">{selectedDrug.strength}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Dosage Form:</label>
                  <p className="text-gray-900">{selectedDrug.dosageForm}</p>
                </div>
              </div>

              {selectedDrug.activeIngredients && selectedDrug.activeIngredients.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700">Active Ingredients:</label>
                  <p className="text-gray-900">{selectedDrug.activeIngredients.join(', ')}</p>
                </div>
              )}

              {selectedDrug.description && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700">Description:</label>
                  <p className="text-gray-900">{selectedDrug.description}</p>
                </div>
              )}

              {selectedDrug.sideEffects && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-amber-700">Side Effects:</label>
                  <p className="text-amber-800">{selectedDrug.sideEffects}</p>
                </div>
              )}

              {selectedDrug.contraindications && (
                <div className="mb-6">
                  <label className="text-sm font-semibold text-red-700">Contraindications:</label>
                  <p className="text-red-800">{selectedDrug.contraindications}</p>
                </div>
              )}

              {/* Pharmacy Selection or Specific Purchase */}
              {selectedPharmacy ? (
                <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Purchase Details</h3>

                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">{selectedPharmacy.name}</p>
                      {selectedPharmacy.isVerified && (
                        <div className="flex items-center space-x-1 text-xs text-blue-700">
                          <ShieldCheckIcon className="w-3 h-3" />
                          <span>Verified Pharmacy</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-semibold text-blue-700">Available Stock:</label>
                      <p className="text-green-600 font-semibold">{selectedPharmacy.quantity} units</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-700">Unit Price:</label>
                      <p className="text-blue-900 font-bold text-lg">{formatCurrency(selectedPharmacy.price)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-semibold text-blue-700">Batch Information:</label>
                    <p className="text-sm text-blue-800">
                      Batch: {selectedPharmacy.batchNumber} • Expires: {new Date(selectedPharmacy.expiryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="text-sm font-semibold text-blue-700 mb-2 block">Quantity:</label>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-blue-900 w-16 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(selectedPharmacy.quantity, quantity + 1))}
                        className="w-10 h-10 bg-white rounded-xl shadow flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Maximum available: {selectedPharmacy.quantity} units
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Total Cost:</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(selectedPharmacy.price * quantity)}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(selectedDrug, selectedPharmacy, quantity)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ) : (
                selectedDrug.pharmacies && selectedDrug.pharmacies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Available at {selectedDrug.pharmacies.length} pharmacies</h3>
                    <div className="space-y-4">
                      {selectedDrug.pharmacies.map((pharmacy) => (
                        <div
                          key={pharmacy.id}
                          className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setSelectedPharmacy(pharmacy)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircleIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{pharmacy.name}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  {pharmacy.isVerified && (
                                    <div className="flex items-center space-x-1">
                                      <ShieldCheckIcon className="w-3 h-3" />
                                      <span>Verified</span>
                                    </div>
                                  )}
                                  <span>{pharmacy.quantity} in stock</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{formatCurrency(pharmacy.price)}</p>
                              <p className="text-xs text-gray-500">per unit</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
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
