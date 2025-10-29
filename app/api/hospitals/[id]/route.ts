import { NextRequest, NextResponse } from 'next/server'
import { getHospitalById } from '@/lib/db/hospitals'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hospital = await getHospitalById(id)
    
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(hospital)
  } catch (error) {
    console.error('Error fetching hospital:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospital' },
      { status: 500 }
    )
  }
}
