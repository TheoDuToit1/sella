'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2, Shield, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PayFastPaymentProps {
  orderId: string
  amount: number
  onPaymentInitiated?: () => void
  onPaymentError?: (error: string) => void
}

export default function PayFastPayment({ 
  orderId, 
  amount, 
  onPaymentInitiated, 
  onPaymentError 
}: PayFastPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiatePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/payfast/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          returnUrl: `${window.location.origin}/customer/orders/${orderId}/payment/success`,
          cancelUrl: `${window.location.origin}/customer/orders/${orderId}/payment/cancelled`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      if (data.success && data.payment) {
        // Create a form and submit it to PayFast
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.payment.paymentUrl
        form.style.display = 'none'

        // Add all payment data as hidden inputs
        Object.entries(data.payment.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })

        document.body.appendChild(form)
        
        // Notify parent component
        onPaymentInitiated?.()
        
        // Submit form to redirect to PayFast
        form.submit()
      } else {
        throw new Error('Invalid payment response')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate payment'
      setError(errorMessage)
      onPaymentError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          PayFast Payment
        </CardTitle>
        <CardDescription>
          Secure payment processing for South African customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Order Total</span>
            <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Including VAT and delivery fees
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Accepted Payment Methods</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
              <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                VISA
              </div>
              <span className="text-sm text-gray-600">Visa</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
              <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                MC
              </div>
              <span className="text-sm text-gray-600">Mastercard</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
              <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
                EFT
              </div>
              <span className="text-sm text-gray-600">Instant EFT</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
              <div className="w-8 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                SID
              </div>
              <span className="text-sm text-gray-600">SID Secure</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
          <Shield className="h-4 w-4 text-blue-600" />
          <span>
            Your payment is secured by PayFast, South Africa's leading payment processor
          </span>
        </div>

        <Button 
          onClick={initiatePayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {formatCurrency(amount)}
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          You will be redirected to PayFast to complete your payment securely
        </div>
      </CardContent>
    </Card>
  )
}
