'use client'

import { useState } from 'react'
import { Clock, User, Package, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  customer_name: string
  status: 'PLACED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  items_count: number
  total: number
  created_at: string
  delivery_time: string
}

interface OrdersQueueProps {
  orders: Order[]
}

const statusColors = {
  PLACED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-green-100 text-green-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  PLACED: 'New Order',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered'
}

export default function OrdersQueue({ orders }: OrdersQueueProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    // This would call the API to update order status
    console.log(`Updating order ${orderId} to ${newStatus}`)
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">No orders in queue</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
                <span className="text-sm text-gray-500">#{order.id}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{order.items_count} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(new Date(order.created_at))}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(order.total)}
                </div>
                <div className="text-sm text-gray-500">
                  Est. delivery: {order.delivery_time}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {order.status === 'PLACED' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Accept Order
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOrder(order.id)}
                >
                  View Details
                </Button>
              </>
            )}
            
            {order.status === 'PREPARING' && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => updateOrderStatus(order.id, 'READY')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Ready
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  Update Weights
                </Button>
              </>
            )}
            
            {order.status === 'READY' && (
              <Button 
                size="sm" 
                onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Assign Driver
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
