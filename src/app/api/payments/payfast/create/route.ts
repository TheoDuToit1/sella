import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { getPayFastService } from '@/lib/payfast'
import { z } from 'zod'

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { orderId, returnUrl, cancelUrl } = createPaymentSchema.parse(body)

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_customer_id_fkey(id),
        merchant_outlets(
          merchants(name)
        )
      `)
      .eq('id', orderId)
      .eq('customer_id', session.user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order is in correct state for payment
    if (order.payment_status !== 'PENDING') {
      return NextResponse.json({ error: 'Order payment already processed' }, { status: 400 })
    }

    // Get customer email
    const customerEmail = session.user.email!
    const customerName = session.user.user_metadata?.full_name || 'Customer'

    // Calculate amount to charge (use final total if available, otherwise estimated)
    const amount = order.grand_total_final || order.grand_total_est

    // Create PayFast service
    const payFastService = getPayFastService()

    // Generate payment URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${baseUrl}/customer/orders/${orderId}/payment/success`
    const defaultCancelUrl = `${baseUrl}/customer/orders/${orderId}/payment/cancelled`
    const notifyUrl = `${baseUrl}/api/payments/payfast/notify`

    // Create payment
    const payment = payFastService.createPayment({
      orderId,
      amount,
      customerEmail,
      customerName,
      itemName: `Order from ${order.merchant_outlets?.merchants?.name || 'Sella'}`,
      itemDescription: `Order #${orderId.slice(-8)}`,
      returnUrl: returnUrl || defaultReturnUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      notifyUrl,
    })

    // Store payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        provider: 'PAYFAST',
        amount,
        currency: 'ZAR',
        status: 'PENDING',
      })

    if (paymentError) {
      console.error('Failed to store payment record:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        paymentUrl: payFastService.getPaymentUrl(),
        paymentData: payment,
        amount,
        orderId,
      }
    })

  } catch (error) {
    console.error('PayFast payment creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
