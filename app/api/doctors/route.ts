import { NextRequest, NextResponse } from 'next/server'
import { searchDoctors } from '@/lib/db/doctors'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params = {
      query: searchParams.get('query') || undefined,
      specialization: searchParams.get('specialization') || undefined,
      country: searchParams.get('country') || undefined,
      consultationType: searchParams.get('consultationType') as 'VIRTUAL' | 'IN_PERSON' || undefined,
      minExperience: searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : undefined,
      maxFee: searchParams.get('maxFee') ? parseInt(searchParams.get('maxFee')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      sortBy: searchParams.get('sortBy') as 'relevance' | 'experience' | 'price' | 'rating' || 'relevance',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await searchDoctors(params)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching doctors:', error)
    return NextResponse.json(
      { error: 'Failed to search doctors' },
      { status: 500 }
    )
  }
}
