import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000'

    console.log('Environment check:', {
      hasPublicKey: !!publicKey,
      hasSecretKey: !!secretKey,
      publicKeyLength: publicKey?.length || 0,
      secretKeyLength: secretKey?.length || 0,
      baseUrl
    })

    if (!publicKey || !secretKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Flutterwave API keys not configured',
        details: {
          hasPublicKey: !!publicKey,
          hasSecretKey: !!secretKey
        }
      }, { status: 500 })
    }

    // Test Flutterwave API connectivity
    const testResponse = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    const isConnected = testResponse.ok
    const responseStatus = testResponse.status

    return NextResponse.json({
      status: isConnected ? 'success' : 'error',
      message: isConnected ? 'Flutterwave API is accessible' : 'Flutterwave API connection failed',
      details: {
        apiStatus: responseStatus,
        hasPublicKey: !!publicKey,
        hasSecretKey: !!secretKey,
        baseUrl,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Flutterwave debug error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Flutterwave connectivity',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}