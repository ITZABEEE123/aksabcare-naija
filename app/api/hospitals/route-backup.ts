import { NextRequest, NextResponse } from 'next/server'
import { searchHospitals } from '@/lib/db/hospitals'
import { FacilityLevel } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params = {
      query: searchParams.get('query') || undefined,
      state: searchParams.get('state') || undefined,
      city: searchParams.get('city') || undefined,
      specializations: searchParams.get('specializations')?.split(',') || undefined,
      facilityLevel: searchParams.get('facilityLevel') as FacilityLevel || undefined,
      isEmergencyAvailable: searchParams.get('isEmergencyAvailable') === 'true' || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await searchHospitals(params)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching hospitals:', error)
    return NextResponse.json(
      { error: 'Failed to search hospitals' },
      { status: 500 }
    )
  }
}
