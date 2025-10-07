import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { z } from 'zod'

const createOrderSchema = z.object({
  delivery_address_id: z.string().uuid(),
  delivery_window: z.string(),
  payment_method: z.enum(['PAYFAST', 'OZOW', 'SNAPSCAN', 'COD']),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    name: z.string(),
    is_weight_based: z.boolean(),
    estimated_weight_g: z.number().optional(),
    quantity: z.number().min(1),
    unit_price: z.number().optional(),
    price_per_kg: z.number().optional(),
    estimated_total: z.number()
  })),
  subtotal: z.number(),
  delivery_fee: z.number(),
  tax_total: z.number(),
  discount_total: z.number().default(0),
  grand_total_est: z.number(),
  reward_points_used: z.number().default(0)
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const orderData = createOrderSchema.parse(body)

    // Validate that all items belong to the same merchant
    const productIds = orderData.items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, merchant_id')
      .in('id', productIds)

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'Invalid products' }, { status: 400 })
    }

    const merchantIds = [...new Set(products.map(p => p.merchant_id))]
    if (merchantIds.length > 1) {
      return NextResponse.json({ error: 'Items must be from the same merchant' }, { status: 400 })
    }

    // Get merchant outlet (assuming first outlet for now)
    const { data: outlet, error: outletError } = await supabase
      .from('merchant_outlets')
      .select('id')
      .eq('merchant_id', merchantIds[0])
      .limit(1)
      .single()

    if (outletError || !outlet) {
      return NextResponse.json({ error: 'Merchant outlet not found' }, { status: 400 })
    }

    // Parse delivery window
    const [windowStart, windowEnd] = orderData.delivery_window.split(' - ')
    const today = new Date()
    const deliveryStart = new Date(today.toDateString() + ' ' + windowStart)
    const deliveryEnd = new Date(today.toDateString() + ' ' + windowEnd)

    // If the time has passed today, schedule for tomorrow
    if (deliveryStart < new Date()) {
      deliveryStart.setDate(deliveryStart.getDate() + 1)
      deliveryEnd.setDate(deliveryEnd.getDate() + 1)
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: session.user.id,
        outlet_id: outlet.id,
        status: 'PLACED',
        subtotal: orderData.subtotal,
        delivery_fee: orderData.delivery_fee,
        discount_total: orderData.discount_total,
        tax_total: orderData.tax_total,
        grand_total_est: orderData.grand_total_est,
        payment_status: 'PENDING',
        payment_method: orderData.payment_method,
        delivery_window_start: deliveryStart.toISOString(),
        delivery_window_end: deliveryEnd.toISOString(),
        delivery_address_id: orderData.delivery_address_id,
        notes: orderData.notes || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      name_snapshot: item.name,
      is_weight_based: item.is_weight_based,
      est_weight_g: item.estimated_weight_g || null,
      unit_price: item.unit_price || null,
      price_per_kg: item.price_per_kg || null,
      line_total_est: item.estimated_total,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Try to clean up the order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Handle reward points redemption
    if (orderData.reward_points_used > 0) {
      try {
        await supabase.rpc('fn_rewards_redeem', {
          p_order_id: order.id,
          p_points: orderData.reward_points_used
        })
      } catch (rewardError) {
        console.error('Reward redemption error:', rewardError)
        // Don't fail the order for reward errors
      }
    }

    // Log order creation
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: session.user.id,
        actor_role: 'customer',
        entity: 'orders',
        entity_id: order.id,
        action: 'create',
        diff: {
          payment_method: orderData.payment_method,
          total: orderData.grand_total_est,
          items_count: orderData.items.length,
        },
      })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Order creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
