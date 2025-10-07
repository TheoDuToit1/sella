'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatWeight, formatCurrency } from '@/lib/utils'
import { Scale, Check, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrderItem {
  id: string
  product_id: string
  name_snapshot: string
  is_weight_based: boolean
  est_weight_g: number | null
  final_weight_g: number | null
  price_per_kg: number | null
  line_total_est: number
  line_total_final: number | null
}

interface WeightFinalizerProps {
  orderItems: OrderItem[]
  orderId: string
  onWeightUpdated: () => void
}

export default function WeightFinalizer({ orderItems, orderId, onWeightUpdated }: WeightFinalizerProps) {
  const [finalizing, setFinalizing] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<string, string>>({})

  const weightBasedItems = orderItems.filter(item => item.is_weight_based)

  const handleWeightChange = (itemId: string, weight: string) => {
    setWeights(prev => ({ ...prev, [itemId]: weight }))
  }

  const finalizeWeight = async (item: OrderItem) => {
    const finalWeightG = parseInt(weights[item.id]) || 0
    
    if (finalWeightG <= 0) {
      alert('Please enter a valid weight')
      return
    }

    setFinalizing(item.id)

    try {
      const { data, error } = await supabase.rpc('fn_finalize_weight', {
        p_order_item_id: item.id,
        p_final_weight_g: finalWeightG
      })

      if (error) throw error

      if (data.success) {
        onWeightUpdated()
        // Clear the weight input
        setWeights(prev => ({ ...prev, [item.id]: '' }))
      } else {
        alert(data.error || 'Failed to finalize weight')
      }
    } catch (error: any) {
      console.error('Error finalizing weight:', error)
      alert('Failed to finalize weight: ' + error.message)
    } finally {
      setFinalizing(null)
    }
  }

  const calculateNewTotal = (item: OrderItem, newWeightG: number) => {
    if (!item.price_per_kg) return item.line_total_est
    return (newWeightG / 1000) * item.price_per_kg
  }

  const calculateDifference = (item: OrderItem, newWeightG: number) => {
    const newTotal = calculateNewTotal(item, newWeightG)
    return newTotal - item.line_total_est
  }

  if (weightBasedItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Scale className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No weight-based items in this order</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Finalize Weights
        </CardTitle>
        <CardDescription>
          Weigh each item and enter the final weights to update the order total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {weightBasedItems.map((item) => {
          const currentWeight = weights[item.id] || ''
          const currentWeightG = parseInt(currentWeight) || 0
          const isFinalized = item.final_weight_g !== null
          const newTotal = currentWeightG > 0 ? calculateNewTotal(item, currentWeightG) : 0
          const difference = currentWeightG > 0 ? calculateDifference(item, currentWeightG) : 0

          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name_snapshot}</h4>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatCurrency(item.price_per_kg || 0)}/kg
                  </div>
                </div>
                {isFinalized && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="h-4 w-4" />
                    Finalized
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Estimated Weight
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatWeight(item.est_weight_g || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(item.line_total_est)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {isFinalized ? 'Final Weight' : 'Actual Weight'}
                  </label>
                  {isFinalized ? (
                    <div>
                      <div className="text-lg font-semibold text-green-900">
                        {formatWeight(item.final_weight_g || 0)}
                      </div>
                      <div className="text-sm text-green-600">
                        {formatCurrency(item.line_total_final || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={currentWeight}
                          onChange={(e) => handleWeightChange(item.id, e.target.value)}
                          placeholder="Enter weight"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          min="1"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          g
                        </span>
                      </div>
                      <Button
                        onClick={() => finalizeWeight(item)}
                        disabled={!currentWeight || finalizing === item.id}
                        size="sm"
                      >
                        {finalizing === item.id ? 'Saving...' : 'Finalize'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Preview */}
              {currentWeightG > 0 && !isFinalized && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">New Total:</span>
                    <span className="font-medium">{formatCurrency(newTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Difference:</span>
                    <span className={`font-medium ${difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                    </span>
                  </div>
                </div>
              )}

              {/* Weight Difference Alert */}
              {isFinalized && item.est_weight_g && item.final_weight_g && (
                Math.abs(item.est_weight_g - item.final_weight_g) > item.est_weight_g * 0.1
              ) && (
                <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 rounded-lg p-2 mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Weight differs significantly from estimate 
                    ({Math.abs(((item.final_weight_g - item.est_weight_g) / item.est_weight_g * 100)).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600 mb-2">
            Progress: {weightBasedItems.filter(item => item.final_weight_g !== null).length} of {weightBasedItems.length} items finalized
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(weightBasedItems.filter(item => item.final_weight_g !== null).length / weightBasedItems.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
