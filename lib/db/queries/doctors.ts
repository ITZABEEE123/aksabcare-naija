import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

export async function searchDoctors(params: {
  query?: string
  specialization?: string
  country?: string
  maxFee?: number
  isAvailable?: boolean
  languages?: string[]
  limit?: number
  offset?: number
}) {
  const {
    query,
    specialization,
    country,
    maxFee,
    isAvailable,
    languages,
    limit = 20,
    offset = 0
  } = params

  const where: Prisma.DoctorWhereInput = {
    user: {
      isActive: true,
      isVerified: true,
    }
  }

  if (query) {
    where.OR = [
      {
        user: {
          profile: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ]
          }
        }
      },
      { specialization: { contains: query, mode: 'insensitive' } },
      { bio: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (specialization) {
    where.specialization = { equals: specialization, mode: 'insensitive' }
  }

  if (country) {
    where.country = { equals: country, mode: 'insensitive' }
  }

  if (maxFee) {
    where.consultationFee = { lte: maxFee }
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable
  }

  if (languages && languages.length > 0) {
    where.languages = { hasSome: languages }
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true
          }
        },
        availability: true,
        hospitals: {
          include: {
            hospital: {
              include: {
                address: true
              }
            }
          }
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { consultationFee: 'asc' }
      ],
      take: limit,
      skip: offset,
    }),
    prisma.doctor.count({ where })
  ])

  return {
    doctors,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit)
    }
  }
}

export async function getDoctorById(id: string) {
  return await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true
        }
      },
      availability: true,
      hospitals: {
        include: {
          hospital: {
            include: {
              address: true
            }
          }
        }
      },
      reviews: {
        include: {
          patient: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          appointments: true,
          reviews: true,
        }
      }
    }
  })
}

export async function getDoctorAvailability(doctorId: string, date: Date) {
  const dayOfWeek = date.getDay()

  const availability = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true,
    }
  })

  // Get existing appointments for the date
  const startOfDay = new Date(date.setHours(0, 0, 0, 0))
  const endOfDay = new Date(date.setHours(23, 59, 59, 999))

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
      }
    }
  })

  return {
    availability,
    existingAppointments
  }
}