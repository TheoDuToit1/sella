'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Clock, CreditCard, Gift } from 'lucide-react'
import { formatCurrency, getDeliveryTimeSlots } from '@/lib/utils'
import PayFastPayment from './PayFastPayment'
import RewardsWallet from './RewardsWallet'
import Cart from './Cart'

interface Address {
  id: string
  line1: string
  line2?: string
  suburb: string
  city: string
  province: string
  postcode: string
}

interface CheckoutFormProps {
  customerId: string
  customerEmail: string
  addresses: Address[]
}

export default function CheckoutForm({ customerId, customerEmail, addresses }: CheckoutFormProps) {
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [deliveryWindow, setDeliveryWindow] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'PAYFAST' | 'COD'>('PAYFAST')
  const [notes, setNotes] = useState('')
  const [cartItems, setCartItems] = useState<any[]>([])
  const [rewardPointsToUse, setRewardPointsToUse] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [creating, setCreating] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const timeSlots = getDeliveryTimeSlots()

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.estimated_total, 0)
    const vatAmount = subtotal * 0.15
    const deliveryFee = 35
    const total = subtotal + vatAmount + deliveryFee - discount
    
    return { subtotal, vatAmount, deliveryFee, total }
  }

  const createOrder = async () => {
    if (!selectedAddress || !deliveryWindow || cartItems.length === 0) {
      alert('Please complete all required fields')
      return
    }

    setCreating(true)

    try {
      const totals = calculateTotals()
      
      // Create order
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_address_id: selectedAddress,
          delivery_window: deliveryWindow,
          payment_method: paymentMethod,
          notes,
          items: cartItems,
          subtotal: totals.subtotal,
          delivery_fee: totals.deliveryFee,
          tax_total: totals.vatAmount,
          discount_total: discount,
          grand_total_est: totals.total,
          reward_points_used: rewardPointsToUse
        })
      })

      const orderData = await orderResponse.json()
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      setOrderId(orderData.orderId)
      
      // Clear cart
      localStorage.removeItem(`cart_${customerId}`)
      
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Failed to create order: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const totals = calculateTotals()

  if (orderId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Order Created Successfully!</CardTitle>
            <CardDescription>
              Order ID: {orderId}
            </CardDescription>
          </CardHeader>
        </Card>

        {paymentMethod === 'PAYFAST' && (
          <PayFastPayment
            orderId={orderId}
            amount={totals.total}
            onPaymentInitiated={() => {
              // Redirect will happen automatically
            }}
            onPaymentError={(error) => {
              alert('Payment failed: ' + error)
            }}
          />
        )}

        {paymentMethod === 'COD' && (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cash on Delivery Selected
              </h3>
              <p className="text-gray-600">
                Please have {formatCurrency(totals.total)} ready for the driver.
                Final amount may vary based on actual weights.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      <Cart customerId={customerId} onItemsChange={setCartItems} />

      {cartItems.length > 0 && (
        <>
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No addresses found</p>
                  <Button variant="outline">Add New Address</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label key={address.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress === address.id}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{address.line1}</div>
                        {address.line2 && <div className="text-sm text-gray-600">{address.line2}</div>}
                        <div className="text-sm text-gray-600">
                          {address.suburb}, {address.city}, {address.province} {address.postcode}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delivery Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select delivery window</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Rewards */}
          <RewardsWallet
            customerId={customerId}
            showRedeemOption={true}
            onPointsRedeemed={(points, discountAmount) => {
              setRewardPointsToUse(points)
              setDiscount(discountAmount)
            }}
          />

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="PAYFAST"
                    checked={paymentMethod === 'PAYFAST'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'PAYFAST')}
                  />
                  <div className="flex-1">
                    <div className="font-medium">PayFast (Cards & EFT)</div>
                    <div className="text-sm text-gray-600">Pay securely with card or instant EFT</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                  />
                  <div className="flex-1">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay with cash when your order arrives</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for the merchant or driver..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Final Summary & Place Order */}
          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15%)</span>
                <span>{formatCurrency(totals.vatAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatCurrency(totals.deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Reward Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <Button
                onClick={createOrder}
                disabled={creating || !selectedAddress || !deliveryWindow}
                className="w-full"
                size="lg"
              >
                {creating ? 'Creating Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
