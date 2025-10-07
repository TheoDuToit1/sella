import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { getPayFastService, PAYFAST_STATUS } from '@/lib/payfast'

// Use service role key for webhook processing
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Parse form data from PayFast
    const formData = await request.formData()
    const data: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      data[key] = value.toString()
    }

    console.log('PayFast notification received:', data)

    // Validate PayFast notification
    const payFastService = getPayFastService()
    const validation = payFastService.validatePayment(data)

    if (!validation.isValid) {
      console.error('Invalid PayFast notification:', validation.error)
      return NextResponse.json({ error: 'Invalid notification' }, { status: 400 } as any)
    }

    const { orderId, paymentStatus, amount } = validation

    if (!orderId) {
      console.error('No order ID in PayFast notification')
      return NextResponse.json({ error: 'No order ID' }, { status: 400 } as any)
    }

    // Handle delta payments (weight adjustments)
    const isDeltaPayment = orderId.includes('-DELTA-')
    const actualOrderId = isDeltaPayment ? orderId.split('-DELTA-')[0] : orderId

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', actualOrderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', actualOrderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 } as any)
    }

    // Update payment status based on PayFast response
    let newPaymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' = 'PENDING'
    let newOrderStatus = (order as any).status

    switch (paymentStatus) {
      case PAYFAST_STATUS.COMPLETE:
        newPaymentStatus = 'PAID'
        if ((order as any).status === 'PLACED') {
          newOrderStatus = 'PREPARING'
        }
        break
      case PAYFAST_STATUS.FAILED:
      case PAYFAST_STATUS.CANCELLED:
        newPaymentStatus = 'FAILED'
        break
      default:
        newPaymentStatus = 'PENDING'
    }

    // Update payment record
    // @ts-ignore
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: newPaymentStatus,
        provider_ref: data.pf_payment_id,
        captured_at: newPaymentStatus === 'PAID' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('order_id', actualOrderId)
      .eq('provider', 'PAYFAST')

    if (paymentUpdateError) {
      console.error('Failed to update payment:', paymentUpdateError)
    }

    // Update order status
    // @ts-ignore
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', actualOrderId)

    if (orderUpdateError) {
      console.error('Failed to update order:', orderUpdateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 } as any)
    }

    // Log the payment event
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: null, // System action
        actor_role: null,
        entity: 'payments',
        entity_id: actualOrderId,
        action: 'payfast_notification',
        diff: {
          payment_status: newPaymentStatus,
          payfast_status: paymentStatus,
          amount: amount,
          is_delta_payment: isDeltaPayment,
          pf_payment_id: data.pf_payment_id,
        },
      } as any)

    // If payment is successful and it's not a delta payment, create delivery record
    if (newPaymentStatus === 'PAID' && !isDeltaPayment) {
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: actualOrderId,
          status: 'ASSIGNED',
        } as any)

      if (deliveryError) {
        console.error('Failed to create delivery record:', deliveryError)
      }
    }

    // Send confirmation email (implement with Resend later)
    if (newPaymentStatus === 'PAID') {
      // TODO: Send order confirmation email
      console.log(`Order ${actualOrderId} payment confirmed - should send email`)
    }

    return NextResponse.json({ success: true } as any)

  } catch (error) {
    console.error('PayFast notification processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 } as any)
  }
}

// PayFast sends GET requests to test the endpoint
export async function GET() {
  return NextResponse.json({ status: 'PayFast webhook endpoint active' } as any)
}













