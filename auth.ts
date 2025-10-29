// 🔐 MAIN AUTHENTICATION SYSTEM FOR AKSABHEALTH NG
// ==================================================
// This is the heart of our authentication system - it handles everything related to user login,
// session management, and security for our healthcare platform.
//
// 🏥 HEALTHCARE-SPECIFIC AUTHENTICATION FEATURES:
// - Different user roles (Patient, Doctor, Admin)
// - Email verification requirements
// - Integration with our database for medical records
// - Secure handling of sensitive healthcare data
// - Multiple login methods (email/password, Google OAuth)

// 📦 IMPORT NECESSARY MODULES
// ===========================
import NextAuth, { type DefaultSession } from 'next-auth'          // Main authentication framework
import { PrismaAdapter } from '@auth/prisma-adapter'               // Database adapter for NextAuth
import CredentialsProvider from 'next-auth/providers/credentials'  // Email/password login
import GoogleProvider from 'next-auth/providers/google'            // Google OAuth login
import { prisma } from '@/lib/db/prisma'                           // Database connection
import { authConfig } from './auth.config'                         // Our custom auth configuration
import bcrypt from 'bcryptjs'                                      // Password hashing/verification
import { UserRole } from '@prisma/client'                          // TypeScript types from our database

// 🎭 TYPE SYSTEM EXTENSIONS
// =========================
// NextAuth comes with basic user properties, but our healthcare platform needs more!
// We extend the built-in types to include healthcare-specific information.

// 👤 EXTEND USER TYPE
// ===================
// Add custom properties to NextAuth's User interface
// This allows us to store healthcare-specific data in the user object
declare module 'next-auth' {
  interface User {
    role: UserRole        // PATIENT, DOCTOR, or ADMIN - determines access permissions
    isVerified: boolean   // Has the user verified their email? (important for medical platform)
    doctorId?: string     // If user is a doctor, link to their doctor profile
    patientId?: string    // If user is a patient, link to their patient medical records
  }
  
  // 🎫 EXTEND SESSION TYPE
  // ======================
  // The session is what's available to React components to check "who is logged in?"
  interface Session {
    user: {
      id: string            // Unique user identifier from database
      role: UserRole        // Their role in the system (determines what they can access)
      isVerified: boolean   // Email verification status (security requirement)
      doctorId?: string     // Link to doctor profile if applicable
      patientId?: string    // Link to patient medical records if applicable
    } & DefaultSession['user']  // Plus all the default NextAuth user properties (name, email, image)
  }
}

// 🎟️ EXTEND JWT TOKEN TYPE
// =========================
// JWT tokens store user information between requests
// We extend them to include our custom healthcare fields
declare module '@auth/core/jwt' {
  interface JWT {
    role?: UserRole       // User role stored in the token
    isVerified?: boolean  // Email verification status
    doctorId?: string     // Doctor profile reference
    patientId?: string    // Patient profile reference
  }
}

// 🏗️ MAIN AUTHENTICATION CONFIGURATION
// =====================================
// This is where we configure NextAuth with all our custom settings,
// providers, callbacks, and database integration
export const {
  handlers,  // HTTP handlers for auth API routes (/api/auth/*)
  signIn,    // Function to sign users in programmatically  
  signOut,   // Function to sign users out programmatically
  auth,      // Function to get current session (used in components and API routes)
} = NextAuth({
  
  // 📋 MERGE WITH BASE CONFIGURATION
  // =================================
  // Spread our base auth config (route protection, page redirects, etc.)
  ...authConfig,
  
  // 🗄️ DATABASE ADAPTER CONFIGURATION
  // ==================================
  // PrismaAdapter connects NextAuth to our PostgreSQL database
  // This allows NextAuth to:
  // - Store user accounts, sessions, and verification tokens
  // - Link OAuth accounts to our user records
  // - Manage user sessions across devices
  // - Integrate with our existing healthcare data
  adapter: PrismaAdapter(prisma),
  
  // 🎫 SESSION STRATEGY
  // ===================
  // JWT (JSON Web Token) strategy stores user info in encrypted browser tokens
  // Alternative would be 'database' strategy (stores sessions in database)
  // JWT is chosen because:
  // - Better performance (no database lookup for each request)
  // 🎫 SESSION STRATEGY AND CONFIGURATION
  // =====================================
  // JWT (JSON Web Token) strategy stores user info in encrypted browser tokens
  // Alternative would be 'database' strategy (stores sessions in database)
  // JWT is chosen because:
  // - Better performance (no database lookup for each request)
  // - Stateless (works well with serverless functions)
  // - Scales better with multiple servers
  session: { 
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (in seconds)
    updateAge: 60 * 60,   // Update session every hour to prevent auto-logout
  },
  
  // 🔄 AUTHENTICATION CALLBACKS
  // ============================
  // Callbacks run at specific points in the authentication flow
  // They allow us to customize behavior and add our healthcare-specific logic
  callbacks: {
    
    // 🚪 SIGN IN CALLBACK
    // ===================
    // This runs before a user is allowed to sign in
    // We use it to prevent doctors from creating patient accounts via OAuth
    async signIn({ user, account }) {
      // Skip checks for credentials provider (handled in authorize function)
      if (account?.provider === 'credentials') {
        return true
      }
      
      // For OAuth providers (Google, etc.), check for doctor email conflicts
      if (account?.provider === 'google' && user.email) {
        // Check if this email belongs to an existing doctor
        const existingDoctor = await prisma.doctor.findFirst({
          where: {
            user: {
              email: user.email
            }
          },
          include: {
            user: true
          }
        })
        
        if (existingDoctor) {
          console.log(`🚨 Blocked OAuth sign-in: Email ${user.email} belongs to existing doctor account`)
          // Prevent sign-in for doctor emails trying to use OAuth as patients
          return false
        }
      }
      
      return true
    },
    
    // 🎫 JWT CALLBACK
    // ===============
    // This runs whenever a JWT token is created or updated
    // It's where we add our custom user data to the token
    async jwt({ token, user, trigger }) {
      
      // 🆕 ON INITIAL SIGN IN
      // =====================
      // When a user first logs in, the 'user' object contains fresh data from the database
      // We transfer this data to the JWT token for future requests
      if (user) {
        console.log('🎫 Adding user data to JWT token:', {
          id: user.id,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
          patientId: user.patientId
        })
        
        token.role = user.role           // Store user role (PATIENT, DOCTOR, ADMIN)
        token.isVerified = user.isVerified   // Store email verification status
        token.doctorId = user.doctorId   // Store doctor profile ID if applicable
        token.patientId = user.patientId // Store patient profile ID if applicable
      }
      
      // If session is updated (e.g., from client-side `useSession().update()`), refresh user data from database
      if (trigger === 'update') {
        const refreshedUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { 
            role: true, 
            isVerified: true,
            doctor: { select: { id: true } },
            patient: { select: { id: true } }
          }
        })
        
        if (refreshedUser) {
          token.role = refreshedUser.role
          token.isVerified = refreshedUser.isVerified
          token.doctorId = refreshedUser.doctor?.id
          token.patientId = refreshedUser.patient?.id
        }
      }
      
      console.log('🎫 JWT token data:', {
        email: token.email,
        role: token.role,
        doctorId: token.doctorId,
        patientId: token.patientId
      })
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.isVerified = token.isVerified as boolean
        session.user.doctorId = token.doctorId as string
        session.user.patientId = token.patientId as string
        
        console.log('📝 Session created:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          doctorId: session.user.doctorId,
          patientId: session.user.patientId
        })
      }
      return session
    }
  },
  providers: [
    // Email/Password authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your-email@example.com'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        },
        role: {
          label: 'Role',
          type: 'text'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null
        }

        try {
          // Find user in database with profile information
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              profile: true,
              patient: true,
              doctor: true,
            }
          })

          if (!user || !user.password) {
            console.log(`❌ User not found or no password: ${credentials.email}`)
            return null
          }

          // STRICT ROLE VALIDATION
          // =====================
          // Ensure user is trying to log in with the correct role
          const requestedRole = credentials.role as string
          if (user.role !== requestedRole) {
            console.log(`🚨 Role mismatch for ${credentials.email}: User role is ${user.role}, but trying to login as ${requestedRole}`)
            return null
          }

          // For doctors, ensure they have a doctor profile
          if (user.role === 'DOCTOR' && !user.doctor) {
            console.log(`🚨 Doctor ${credentials.email} has no doctor profile`)
            return null
          }

          // For patients, ensure they have a patient profile  
          if (user.role === 'PATIENT' && !user.patient) {
            console.log(`🚨 Patient ${credentials.email} has no patient profile`)
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password as string, 
            user.password
          )

          if (!isValidPassword) {
            console.log(`❌ Invalid password for ${credentials.email}`)
            return null
          }

          console.log(`✅ Successful login: ${credentials.email} as ${user.role}`)
          
          // Return user data for session
          return {
            id: user.id,
            email: user.email,
            name: user.profile?.firstName && user.profile?.lastName 
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : user.email,
            role: user.role,
            image: user.profile?.avatar || null,
            isVerified: user.isVerified,
            doctorId: user.doctor?.id,
            patientId: user.patient?.id,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    }),

    // Google OAuth (optional for quick registration)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.PATIENT, // Default role for Google sign-ups
          isVerified: true, // Google-verified accounts are automatically verified
          doctorId: undefined,
          patientId: undefined,
        }
      },
    }),
  ],
})
