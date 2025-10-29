import { prisma } from './prisma'
import { FacilityLevel, Prisma } from '@prisma/client'

export async function searchHospitals(params: {
  query?: string
  state?: string
  city?: string
  specializations?: string[]
  facilityLevel?: FacilityLevel
  isEmergencyAvailable?: boolean
  limit?: number
  offset?: number
}) {
  const {
    query,
    state,
    city,
    specializations,
    facilityLevel,
    isEmergencyAvailable,
    limit = 20,
    offset = 0
  } = params

  try {
    const where: Prisma.HospitalWhereInput = {
      isVerified: true,
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { specializations: { hasSome: [query] } },
      ]
    }

    const addressConditions: Prisma.AddressWhereInput = {}
    if (state) addressConditions.state = { equals: state, mode: 'insensitive' }
    if (city) addressConditions.city = { equals: city, mode: 'insensitive' }
    if (Object.keys(addressConditions).length > 0) where.address = addressConditions

    if (specializations?.length) {
      where.specializations = { hasSome: specializations }
    }
    if (facilityLevel) where.facilityLevel = facilityLevel
    if (isEmergencyAvailable !== undefined) {
      where.isEmergencyAvailable = isEmergencyAvailable
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        include: {
          address: true,
          services: {
            where: { isAvailable: true },
            select: { name: true, description: true, category: true, price: true, currency: true }
          },
          _count: { select: { reviews: true, doctors: true, appointments: true } }
        },
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.hospital.count({ where })
    ])

    return {
      hospitals,
      pagination: { total, limit, offset, pages: Math.ceil(total / limit) }
    }
  } catch (error) {
    console.error('Error in searchHospitals:', error)
    throw new Error('Failed to search hospitals')
  }
}

export async function getHospitalById(id: string) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        address: true,
        services: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
        doctors: {
          include: {
            doctor: { include: { user: { include: { profile: true } } } }
          }
        },
        reviews: {
          include: {
            patient: {
              include: {
                user: {
                  include: { profile: { select: { firstName: true, lastName: true } } }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: { select: { reviews: true, doctors: true, appointments: true } }
      }
    })
    return hospital
  } catch (error) {
    console.error('Error in getHospitalById:', error)
    throw new Error('Failed to fetch hospital details')
  }
}

export async function getNearbyHospitals(params: {
  latitude: number
  longitude: number
  radius: number // in kilometers
  limit?: number
}) {
  const { latitude, longitude, radius, limit = 10 } = params

  try {
    const hospitalsWithCoords = await prisma.hospital.findMany({
      where: {
        isVerified: true,
        address: {
          latitude: { not: null },
          longitude: { not: null }
        }
      },
      include: {
        address: true,
        services: {
          where: { isAvailable: true },
          select: { name: true }
        },
        _count: { select: { reviews: true, doctors: true } }
      }
    })

    const hospitalsWithDistance = hospitalsWithCoords
      .map(hospital => {
        const lat = hospital.address?.latitude
        const lng = hospital.address?.longitude
        if (lat == null || lng == null) return null
        const distance = calculateDistance(latitude, longitude, lat, lng)
        return { ...hospital, distance }
      })
      .filter(
        (h): h is NonNullable<typeof h> => h !== null && h.distance <= radius
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    return hospitalsWithDistance
  } catch (error) {
    console.error('Error in getNearbyHospitals:', error)
    throw new Error('Failed to find nearby hospitals')
  }
}

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function getHospitalStats() {
  try {
    const [
      totalHospitals,
      verifiedHospitals,
      emergencyHospitals,
      tertiaryHospitals
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.hospital.count({ where: { isVerified: true } }),
      prisma.hospital.count({ where: { isEmergencyAvailable: true } }),
      prisma.hospital.count({ where: { facilityLevel: 'TERTIARY' } })
    ])

    return {
      total: totalHospitals,
      verified: verifiedHospitals,
      emergency: emergencyHospitals,
      tertiary: tertiaryHospitals
    }
  } catch (error) {
    console.error('Error in getHospitalStats:', error)
    throw new Error('Failed to fetch hospital statistics')
  }
}
