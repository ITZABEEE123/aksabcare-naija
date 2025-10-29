// 🔐 AUTHENTICATION CONFIGURATION FOR AKSABHEALTH NG
// ====================================================
// This file configures NextAuth.js, our authentication system that handles:
// - User login/logout
// - Session management 
// - Route protection (who can access what pages)
// - Authentication callbacks and redirects
//
// Think of this as the "security guard" for our healthcare platform that decides:
// - Who can enter which areas of the application
// - Where to send users when they try to access restricted areas
// - How to handle login/logout flows

import type { NextAuthConfig } from 'next-auth'  // TypeScript types for NextAuth configuration

// 🏗️ MAIN AUTHENTICATION CONFIGURATION
// =====================================
export const authConfig = {
  
  // 📄 CUSTOM PAGE ROUTING CONFIGURATION
  // ====================================
  // These settings tell NextAuth where to redirect users for authentication actions
  pages: {
    signIn: '/login',    // When users need to log in, send them to our custom login page
    error: '/login',     // If there's an authentication error, also send them to login page
    // We could also configure:
    // signOut: '/goodbye',     // Custom logout page
    // verifyRequest: '/verify', // Email verification page
    // newUser: '/welcome',     // First-time user welcome page
  },

  // 🛡️ AUTHENTICATION CALLBACKS
  // ============================
  // Callbacks are functions that run at specific points in the authentication flow
  // They give us control over what happens when users try to access different parts of our app
  callbacks: {
    
    // 🚦 AUTHORIZATION CALLBACK
    // =========================
    // This function runs EVERY time a user tries to access a page
    // It's like a security checkpoint that decides: "Can this user access this page?"
    //
    // Parameters:
    // - auth: Contains user information if they're logged in (null if not logged in)
    // - request: Contains information about the page they're trying to access
    authorized({ auth, request: { nextUrl } }) {
      
      // 🔍 CHECK USER LOGIN STATUS
      // ==========================
      // Convert the auth object to a boolean: true if user is logged in, false if not
      // The !! converts any truthy value to true, any falsy value to false
      const isLoggedIn = !!auth?.user
      const userRole = auth?.user?.role
      
      // 📍 GET THE PAGE USER IS TRYING TO ACCESS
      // ========================================
      // Extract the path from the URL (e.g., "/patient/dashboard", "/login", "/doctor/appointments")
      const pathname = nextUrl.pathname

      console.log(`🔐 Auth Config: ${pathname} | LoggedIn: ${isLoggedIn} | Role: ${userRole}`)

      // 🌐 PUBLIC ROUTES (NO LOGIN REQUIRED)
      // ====================================
      // These pages can be accessed by anyone, even if they're not logged in
      const publicRoutes = ['/', '/login', '/register']
      
      // If the user is trying to access a public route, always allow it
      if (publicRoutes.includes(pathname)) {
        return true  // ✅ Access granted - no authentication needed
      }

      // � BLOCK ACCESS IF USER IS NOT LOGGED IN
      // ========================================
      if (!isLoggedIn) {
        console.log(`🚨 Unauthorized access to protected route: ${pathname}`)
        return false  // ❌ Access denied - will redirect to /login
      }

      // 🎯 ROLE-BASED ACCESS CONTROL
      // =============================
      // Even if logged in, users can only access routes for their role
      
      // Admin routes - only SUPER_ADMIN can access
      if (pathname.startsWith('/admin') && userRole !== 'SUPER_ADMIN') {
        console.log(`🚨 Non-admin user attempted admin access: ${userRole}`)
        return false
      }

      // Doctor routes - only DOCTOR can access
      if (pathname.startsWith('/doctor') && userRole !== 'DOCTOR') {
        console.log(`🚨 Non-doctor user attempted doctor access: ${userRole}`)
        return false
      }

      // Patient routes - only PATIENT can access
      if (pathname.startsWith('/patient') && userRole !== 'PATIENT') {
        console.log(`🚨 Non-patient user attempted patient access: ${userRole}`)
        return false
      }

      // ✅ ALLOW ACCESS FOR VALID ROLE-BASED REQUESTS
      return true  // ✅ Access granted
    },
    
    // 🔄 ADDITIONAL CALLBACKS CAN BE ADDED HERE
    // ==========================================
    // Other useful callbacks we might add in the future:
    // 
    // jwt: ({ token, user }) => {
    //   // Customize the JWT token that stores user information
    //   if (user) token.role = user.role  // Add user role to token
    //   return token
    // },
    //
    // session: ({ session, token }) => {
    //   // Customize the session object available in components
    //   session.user.role = token.role    // Make role available in session
    //   return session
    // },
    //
    // signIn: ({ user, account, profile }) => {
    //   // Control whether to allow sign in (e.g., email verification checks)
    //   return user.emailVerified ? true : false
    // }
  },

  // 🔌 AUTHENTICATION PROVIDERS
  // ============================
  // This array will be populated in auth.ts with actual authentication methods like:
  // - Email/password authentication
  // - Google OAuth
  // - Facebook OAuth
  // - Magic link authentication
  // We keep it empty here because the actual providers are configured separately
  providers: [],
  
} satisfies NextAuthConfig  // TypeScript validation to ensure our config matches NextAuth requirements