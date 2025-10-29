import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DebugUserPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Current User Debug Info</h1>
          
          <div className="space-y-4">
            <div>
              <label className="font-semibold">User ID:</label>
              <p className="text-gray-600">{session.user.id || 'Not available'}</p>
            </div>
            
            <div>
              <label className="font-semibold">Email:</label>
              <p className="text-gray-600">{session.user.email || 'Not available'}</p>
            </div>
            
            <div>
              <label className="font-semibold">Name:</label>
              <p className="text-gray-600">{session.user.name || 'Not available'}</p>
            </div>
            
            <div>
              <label className="font-semibold">Role:</label>
              <p className="text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {session.user.role || 'No role assigned'}
              </p>
            </div>
            
            <div>
              <label className="font-semibold">Is Active:</label>
              <p className="text-gray-600">{session.user.isVerified?.toString() || 'Not available'}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">Full Session Object:</h3>
            <pre className="text-sm text-blue-700 mt-2 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <a 
              href="/patient" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Try Patient Page
            </a>
            <a 
              href="/doctor" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Doctor Page
            </a>
            <a 
              href="/admin" 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Admin Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
