'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Clock, Package, Truck, MapPin, Phone, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  status: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  payment_method: 'PAYFAST' | 'OZOW' | 'SNAPSCAN' | 'COD'
  subtotal: number
  delivery_fee: number
  tax_total: number
  discount_total: number
  grand_total_est: number
  grand_total_final?: number
  delivery_window_start?: string
  delivery_window_end?: string
  notes?: string
  created_at: string
  updated_at: string
  merchant_outlets: {
    merchants: {
      name: string
      contact_phone: string
    }
  }
  deliveries?: {
    tracking_code: string
    status: string
    driver_id?: string
  }[]
  order_items: {
    id: string
    name_snapshot: string
    is_weight_based: boolean
    est_weight_g?: number
    final_weight_g?: number
    line_total_est: number
    line_total_final?: number
  }[]
}

interface OrderStatusProps {
  orderId: string
  customerId: string
}

const statusSteps = [
  { key: 'PLACED', label: 'Order Placed', icon: Check },
  { key: 'PREPARING', label: 'Preparing', icon: Package },
  { key: 'READY', label: 'Ready for Pickup', icon: Clock },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
]

export default function OrderStatus({ orderId, customerId }: OrderStatusProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
    
    // Set up real-time subscription for order updates
    const subscription = supabase
      .channel(`order_${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, 
        (payload) => {
          console.log('Order updated:', payload)
          fetchOrder()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          merchant_outlets(
            merchants(name, contact_phone)
          ),
          deliveries(tracking_code, status, driver_id),
          order_items(*)
        `)
        .eq('id', orderId)
        .eq('customer_id', customerId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0
    return statusSteps.findIndex(step => step.key === order.status)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'FAILED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const reorderItems = async () => {
    try {
      const { data, error } = await supabase.rpc('fn_reorder_template', {
        p_order_id: orderId
      })

      if (error) throw error

      if (data.success) {
        // Add items to cart
        const cartKey = `cart_${customerId}`
        const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]')
        
        const newItems = data.items.map((item: any) => ({
          id: `${item.product_id}_${Date.now()}`,
          product_id: item.product_id,
          name: item.name,
          is_weight_based: item.is_weight_based,
          estimated_weight_g: item.est_weight_g,
          quantity: 1,
          unit_price: item.unit_price,
          price_per_kg: item.price_per_kg,
          estimated_total: item.is_weight_based 
            ? (item.est_weight_g / 1000) * item.price_per_kg
            : item.unit_price,
          merchant_id: data.outlet_id,
          merchant_name: order?.merchant_outlets?.merchants?.name || 'Merchant'
        }))

        localStorage.setItem(cartKey, JSON.stringify([...existingCart, ...newItems]))
        
        // Redirect to cart
        window.location.href = '/customer/cart'
      }
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Failed to add items to cart')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-500">{error || 'Unable to load order details'}</p>
        </CardContent>
      </Card>
    )
  }

  const currentStepIndex = getCurrentStepIndex()
  const hasWeightBasedItems = order.order_items.some(item => item.is_weight_based)
  const hasFinalWeights = order.order_items.some(item => item.final_weight_g !== null)

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Order #{order.id.slice(-8)}</CardTitle>
              <CardDescription>
                From {order.merchant_outlets?.merchants?.name}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatDateTime(new Date(order.created_at))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Order Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="status-timeline">
            {statusSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              
              return (
                <div key={step.key} className={`status-step flex items-center gap-4 pb-6 ${isCompleted ? 'completed' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isCompleted ? 'text-green-900' : isCurrent ? 'text-blue-900' : 'text-gray-500'}`}>
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div className="text-sm text-gray-600 mt-1">
                        {step.key === 'PREPARING' && 'Your order is being prepared'}
                        {step.key === 'READY' && 'Ready for driver pickup'}
                        {step.key === 'OUT_FOR_DELIVERY' && 'On the way to you'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      {order.deliveries && order.deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tracking Code:</span>
                <span className="font-mono">{order.deliveries[0].tracking_code}</span>
              </div>
              {order.delivery_window_start && (
                <div className="flex justify-between">
                  <span>Delivery Window:</span>
                  <span>
                    {new Date(order.delivery_window_start).toLocaleTimeString()} - 
                    {order.delivery_window_end && new Date(order.delivery_window_end).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          {hasWeightBasedItems && !hasFinalWeights && (
            <CardDescription className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Final weights pending - total may change
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="font-medium">{item.name_snapshot}</div>
                  {item.is_weight_based && (
                    <div className="text-sm text-gray-500">
                      Est: {item.est_weight_g}g
                      {item.final_weight_g && (
                        <span className="ml-2 text-green-600">
                          Final: {item.final_weight_g}g
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(item.final_weight_g ? item.line_total_final! : item.line_total_est)}
                  </div>
                  {item.is_weight_based && item.final_weight_g && item.line_total_final !== item.line_total_est && (
                    <div className={`text-xs ${item.line_total_final! > item.line_total_est ? 'text-red-600' : 'text-green-600'}`}>
                      {item.line_total_final! > item.line_total_est ? '+' : ''}
                      {formatCurrency(item.line_total_final! - item.line_total_est)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Total */}
      <Card>
        <CardHeader>
          <CardTitle>Order Total</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%):</span>
            <span>{formatCurrency(order.tax_total)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-{formatCurrency(order.discount_total)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>
                {formatCurrency(order.grand_total_final || order.grand_total_est)}
                {hasWeightBasedItems && !order.grand_total_final && (
                  <span className="text-sm font-normal text-gray-500 ml-1">(estimated)</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={reorderItems} className="flex-1">
          Reorder Items
        </Button>
        {order.merchant_outlets?.merchants?.contact_phone && (
          <Button variant="outline" className="flex-1">
            <Phone className="mr-2 h-4 w-4" />
            Contact Merchant
          </Button>
        )}
      </div>
    </div>
  )
}
