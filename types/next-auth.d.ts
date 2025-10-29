import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      isVerified: boolean
      doctorId?: string
      patientId?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    isVerified: boolean
    doctorId?: string
    patientId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    isVerified: boolean
  }
}
