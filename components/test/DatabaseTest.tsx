'use client'

import { useEffect, useState } from 'react'

interface HealthStatus {
  status: string
  timestamp: string
  database: {
    status: string
    timestamp: string
  }
}

export function DatabaseTest() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Health check failed:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-4">Checking database connection...</div>
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Database Status</h3>
      <div className="space-y-2">
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          health?.database.status === 'healthy' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {health?.database.status === 'healthy' ? '✅ Connected' : '❌ Disconnected'}
        </div>
        <p className="text-sm text-gray-600">
          Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
        </p>
      </div>
    </div>
  )
}