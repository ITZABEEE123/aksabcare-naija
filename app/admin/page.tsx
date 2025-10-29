import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  // ============ TEMPORARY: AUTHENTICATION DISABLED ============
  // Uncomment when you want to re-enable protection
  
  // const session = await auth()
  // if (!session?.user) {
  //   redirect('/login')
  // }
  // if (session.user.role !== 'SUPER_ADMIN') {
  //   redirect('/login?error=unauthorized')
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            System administration and management
          </p>
          
          {/* Temporarily show static content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-800">Welcome to Admin Panel!</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="bg-blue-100 p-4 rounded">
                <h3 className="font-semibold">Total Users</h3>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <h3 className="font-semibold">Active Doctors</h3>
                <p className="text-2xl font-bold">89</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded">
                <h3 className="font-semibold">Hospitals</h3>
                <p className="text-2xl font-bold">45</p>
              </div>
              <div className="bg-purple-100 p-4 rounded">
                <h3 className="font-semibold">System Uptime</h3>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
