'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatWeight, calculateVAT } from '@/lib/utils'
import Link from 'next/link'

interface CartItem {
  id: string
  product_id: string
  name: string
  is_weight_based: boolean
  estimated_weight_g?: number
  quantity: number
  unit_price?: number
  price_per_kg?: number
  estimated_total: number
  merchant_id: string
  merchant_name: string
}

interface CartProps {
  customerId: string
  onItemsChange?: (items: CartItem[]) => void
}

export default function Cart({ customerId, onItemsChange }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCartItems()
  }, [customerId])

  useEffect(() => {
    onItemsChange?.(items)
  }, [items, onItemsChange])

  const loadCartItems = async () => {
    try {
      // In a real app, this would load from localStorage or a cart API
      const savedCart = localStorage.getItem(`cart_${customerId}`)
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCart = (newItems: CartItem[]) => {
    localStorage.setItem(`cart_${customerId}`, JSON.stringify(newItems))
    setItems(newItems)
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, quantity: newQuantity }
        
        // Recalculate total
        if (item.is_weight_based && item.price_per_kg && item.estimated_weight_g) {
          updatedItem.estimated_total = (item.estimated_weight_g / 1000) * item.price_per_kg * newQuantity
        } else if (item.unit_price) {
          updatedItem.estimated_total = item.unit_price * newQuantity
        }
        
        return updatedItem
      }
      return item
    })

    saveCart(updatedItems)
  }

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId)
    saveCart(updatedItems)
  }

  const clearCart = () => {
    saveCart([])
  }

  const getCartSummary = () => {
    const subtotal = items.reduce((sum, item) => sum + item.estimated_total, 0)
    const vatAmount = calculateVAT(subtotal)
    const estimatedDeliveryFee = 35 // This would be calculated based on location
    const total = subtotal + vatAmount + estimatedDeliveryFee

    return {
      subtotal,
      vatAmount,
      estimatedDeliveryFee,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const groupedItems = items.reduce((groups, item) => {
    if (!groups[item.merchant_id]) {
      groups[item.merchant_id] = {
        merchant_name: item.merchant_name,
        items: []
      }
    }
    groups[item.merchant_id].items.push(item)
    return groups
  }, {} as Record<string, { merchant_name: string; items: CartItem[] }>)

  const summary = getCartSummary()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-4">
            Start shopping to add items to your cart
          </p>
          <Link href="/customer">
            <Button>Browse Merchants</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Items by Merchant */}
      {Object.entries(groupedItems).map(([merchantId, group]) => (
        <Card key={merchantId}>
          <CardHeader>
            <CardTitle className="text-lg">{group.merchant_name}</CardTitle>
            <CardDescription>
              {group.items.length} item{group.items.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🥩</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                  
                  {item.is_weight_based ? (
                    <div className="text-sm text-gray-500 mt-1">
                      <div>Est. {formatWeight(item.estimated_weight_g || 0)} × {item.quantity}</div>
                      <div>{formatCurrency(item.price_per_kg || 0)}/kg</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(item.unit_price || 0)} each
                    </div>
                  )}

                  {item.is_weight_based && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Final price based on actual weight</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.estimated_total)}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({summary.itemCount} items)</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>VAT (15%)</span>
            <span>{formatCurrency(summary.vatAmount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Estimated Delivery</span>
            <span>{formatCurrency(summary.estimatedDeliveryFee)}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(summary.total)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              *Final total may vary based on actual weights
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={clearCart} className="flex-1">
          Clear Cart
        </Button>
        <Link href="/customer/checkout" className="flex-1">
          <Button className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  )
}
