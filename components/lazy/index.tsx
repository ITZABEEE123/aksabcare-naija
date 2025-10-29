/**
 * DYNAMIC IMPORT UTILITIES FOR PERFORMANCE OPTIMIZATION
 * 
 * This utility module provides high-performance dynamic import functions
 * for lazy loading components throughout the AksabCare application.
 * 
 * Performance Benefits:
 * 1. Code Splitting: Reduces initial bundle size
 * 2. Lazy Loading: Components loaded only when needed
 * 3. Preloading: Optional component preloading for better UX
 * 4. Error Handling: Graceful fallbacks for failed imports
 * 5. Loading States: Smooth loading experience
 * 6. Bundle Analysis: Better webpack chunk optimization
 */

import dynamic from 'next/dynamic'

/**
 * LAZY-LOADED HOSPITAL SEARCH COMPONENT
 * 
 * Dynamically imports the hospital search component for optimal performance.
 * Only loads when the hospitals page is accessed.
 */
export const LazyHospitalSearch = dynamic(
  () => import('./HospitalSearch'),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 gpu-accelerated"></div>
        <p className="text-gray-600 font-medium">Loading hospital search...</p>
      </div>
    ),
    ssr: false, // Disable SSR for faster client-side loading
  }
)

/**
 * LAZY-LOADED PHARMACY COMPONENT
 * 
 * Dynamically imports the pharmacy component for optimal performance.
 * Only loads when the pharmacy page is accessed.
 */
export const LazyPharmacySearch = dynamic(
  () => import('./PharmacySearch'),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 gpu-accelerated"></div>
        <p className="text-gray-600 font-medium">Loading pharmacy...</p>
      </div>
    ),
    ssr: false, // Disable SSR for faster client-side loading
  }
)

/**
 * PRELOADING UTILITY FUNCTIONS
 * 
 * These functions can be used to preload components before they're needed,
 * improving perceived performance.
 */

/**
 * Preloads critical components that are likely to be used soon
 */
export const preloadCriticalComponents = () => {
  // Preload components likely to be used in the user journey
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for better performance
    const schedulePreload = (importFn: () => Promise<unknown>) => {
      if ('requestIdleCallback' in window) {
        // Type assertion for requestIdleCallback which may not be in all environments
        (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(() => importFn())
      } else {
        setTimeout(() => importFn(), 1000)
      }
    }

    // Preload based on current page
    const path = window.location.pathname

    if (path.includes('/patient')) {
      schedulePreload(() => import('./HospitalSearch'))
      schedulePreload(() => import('./PharmacySearch'))
    }
  }
}

/**
 * Preloads components when user hovers over navigation links
 */
export const preloadOnHover = (componentPath: string) => {
  const importMap: Record<string, () => Promise<unknown>> = {
    hospitals: () => import('./HospitalSearch'),
    pharmacy: () => import('./PharmacySearch'),
  }

  const importFn = importMap[componentPath]
  if (importFn) {
    importFn().catch(() => {
      // Silently fail preloading - component will load normally when needed
    })
  }
}

/**
 * Component Registration for Bundle Analysis
 */
export const LazyComponents = {
  HospitalSearch: LazyHospitalSearch,
  PharmacySearch: LazyPharmacySearch,
}

/**
 * Default export for convenience
 */
export default LazyComponents