// 💳 FLUTTERWAVE PAYMENT SERVICE
// This file handles all communication with Flutterwave payment gateway
import Flutterwave from 'flutterwave-node-v3'

// Step 1: Get the base URL for our website (where Flutterwave should send users back)
// We try multiple environment variables, with port 3000 as the final fallback
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                process.env.NEXTAUTH_URL || 
                'http://localhost:3000'

const flw = new Flutterwave(
  process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
)

export interface PaymentData {
  amount: number
  currency: string
  email: string
  phone?: string
  name: string
  title: string
  description: string
  logo?: string
  redirect_url?: string
  callback_url?: string
  tx_ref?: string
}

export interface PaymentResponse {
  status: 'success' | 'error'
  message: string
  data?: {
    id?: string;
    link?: string;
    status?: string;
    amount?: number;
    currency?: string;
    tx_ref?: string;
    [key: string]: unknown;
  }
  link?: string
}

export class FlutterwaveService {
  static async initializePayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      const txRef = data.tx_ref || `aksab_${Date.now()}_${Math.random().toString(36).substring(2)}`
      
      // Ensure redirect_url uses the correct tx_ref
      const redirectUrl = data.redirect_url || `${baseUrl}/payment/callback/${txRef}`
      
      console.log('Payment initialization:', { txRef, redirectUrl, baseUrl })
      
      const payload = {
        tx_ref: txRef,
        amount: data.amount,
        currency: data.currency,
        redirect_url: redirectUrl,
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: data.email,
          phonenumber: data.phone || '',
          name: data.name,
        },
        customizations: {
          title: data.title,
          description: data.description,
          logo: data.logo || `${baseUrl}/logo.png`,
        },
      }

      // Use direct API call for hosted payment links
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Flutterwave API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Flutterwave API error:', response.status, errorText)
        throw new Error(`Flutterwave API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        return {
          status: 'success',
          message: 'Payment initialized successfully',
          data: result.data,
          link: result.data.link
        }
      } else {
        return {
          status: 'error',
          message: result.message || 'Payment initialization failed'
        }
      }
    } catch (error) {
      console.error('Flutterwave payment initialization error:', error)
      return {
        status: 'error',
        message: 'Payment service temporarily unavailable'
      }
    }
  }

  static async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await flw.Transaction.verify({ id: transactionId })

      if (response.status === 'success' && response.data.status === 'successful') {
        return {
          status: 'success',
          message: 'Payment verified successfully',
          data: response.data
        }
      } else {
        return {
          status: 'error',
          message: 'Payment verification failed'
        }
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', error)
      return {
        status: 'error',
        message: 'Payment verification service temporarily unavailable'
      }
    }
  }

  static async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const payload: { id: string; amount?: number } = { id: transactionId }
      if (amount) payload.amount = amount

      const response = await flw.Transaction.refund(payload)

      if (response.status === 'success') {
        return {
          status: 'success',
          message: 'Refund processed successfully',
          data: response.data
        }
      } else {
        return {
          status: 'error',
          message: response.message || 'Refund processing failed'
        }
      }
    } catch (error) {
      console.error('Flutterwave refund error:', error)
      return {
        status: 'error',
        message: 'Refund service temporarily unavailable'
      }
    }
  }
}

export default FlutterwaveService
