import { NextRequest, NextResponse } from 'next/server'
import { getNearbyHospitals } from '@/lib/db/hospitals'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '10') // km
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const hospitals = await getNearbyHospitals({
      latitude: lat,
      longitude: lng,
      radius,
      limit: parseInt(searchParams.get('limit') || '10')
    })

    return NextResponse.json({
      hospitals,
      total: hospitals.length
    })
  } catch (error) {
    console.error('Error finding nearby hospitals:', error)
    return NextResponse.json(
      { error: 'Failed to find nearby hospitals' },
      { status: 500 }
    )
  }
}
