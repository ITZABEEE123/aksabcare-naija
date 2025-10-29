import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const userRole = session.user.role

  // Role-based redirect
  switch (userRole) {
    case 'SUPER_ADMIN':
      redirect('/admin')
    case 'DOCTOR':
      redirect('/doctor')
    case 'PATIENT':
    default:
      redirect('/patient')
  }
}
