/**
 * Simple Hospitals API Route - No performance optimizations, just basic functionality
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import type { Hospital, Address, HospitalService } from '@prisma/client'

type HospitalWithRelations = Hospital & {
  address: Address | null
  services: HospitalService[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state') || ''
    const city = searchParams.get('city') || ''
    const query = searchParams.get('query') || ''

    console.log('Simple API called with params:', { state, city, query })

    // Simple query - just get verified hospitals
    const hospitals = await prisma.hospital.findMany({
      where: {
        isVerified: true,
        // Add basic filters if provided
        ...(query && {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        })
      },
      include: {
        address: true,
        services: {
          where: { isAvailable: true }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ],
      take: 25
    })

    console.log(`Found ${hospitals.length} hospitals`)

    const formattedHospitals = hospitals.map((hospital: HospitalWithRelations) => ({
      id: hospital.id,
      name: hospital.name,
      description: hospital.description,
      rating: hospital.rating,
      phone: hospital.phone,
      email: hospital.email,
      website: hospital.website,
      establishedYear: hospital.establishedYear,
      isEmergencyAvailable: hospital.isEmergencyAvailable,
      specializations: hospital.specializations,
      address: hospital.address ? {
        street: hospital.address.street,
        city: hospital.address.city,
        state: hospital.address.state,
        latitude: hospital.address.latitude,
        longitude: hospital.address.longitude
      } : null,
      services: hospital.services.map((service: HospitalService) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        currency: service.currency
      })),
      stats: {
        reviews: hospital.totalReviews,
        doctors: 0, // Will calculate later if needed
        appointments: 0 // Will calculate later if needed
      }
    }))

    return NextResponse.json({
      hospitals: formattedHospitals,
      total: formattedHospitals.length,
      success: true
    })

  } catch (error) {
    console.error('Simple API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospitals', details: error },
      { status: 500 }
    )
  }
}