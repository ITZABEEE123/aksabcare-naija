import { NextRequest, NextResponse } from 'next/server'
import { getDoctorDashboardData } from '@/lib/db/doctors'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const params = await props.params
    const { id } = params
    
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure doctor can only access their own dashboard
    if (session.user.doctorId !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const dashboardData = await getDoctorDashboardData(id)
    
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
