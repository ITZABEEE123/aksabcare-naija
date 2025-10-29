import { prisma } from '../prisma'
import { UserRole, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function createUser(data: {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
  phone?: string
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
      profile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        }
      }
    },
    include: {
      profile: true,
      patient: true,
      doctor: true,
    }
  })
}

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      patient: true,
      doctor: true,
    }
  })
}

export async function verifyUserPassword(email: string, password: string) {
  const user = await findUserByEmail(email)
  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password)
  return isValid ? user : null
}

export async function updateUserProfile(userId: string, data: Prisma.UserProfileUpdateInput) {
  return await prisma.userProfile.update({
    where: { userId },
    data,
    include: {
      user: true,
    }
  })
}