'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatWeight, formatCurrency } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

interface WeightPickerProps {
  product: {
    id: string
    name: string
    price_per_kg: number
    min_weight_g: number
    max_weight_g: number
  }
  onWeightChange: (weightG: number, estimatedPrice: number) => void
  initialWeight?: number
}

const PRESET_WEIGHTS = [250, 500, 750, 1000, 1500, 2000] // in grams

export default function WeightPicker({ product, onWeightChange, initialWeight = 500 }: WeightPickerProps) {
  const [selectedWeight, setSelectedWeight] = useState(initialWeight)
  const [customWeight, setCustomWeight] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const calculatePrice = (weightG: number) => {
    return (weightG / 1000) * product.price_per_kg
  }

  const handlePresetWeight = (weightG: number) => {
    setSelectedWeight(weightG)
    setIsCustom(false)
    setCustomWeight('')
    onWeightChange(weightG, calculatePrice(weightG))
  }

  const handleCustomWeight = (value: string) => {
    setCustomWeight(value)
    const weightG = parseInt(value) || 0
    
    if (weightG >= product.min_weight_g && weightG <= product.max_weight_g) {
      setSelectedWeight(weightG)
      onWeightChange(weightG, calculatePrice(weightG))
    }
  }

  const adjustWeight = (delta: number) => {
    const newWeight = Math.max(
      product.min_weight_g,
      Math.min(product.max_weight_g, selectedWeight + delta)
    )
    setSelectedWeight(newWeight)
    if (isCustom) {
      setCustomWeight(newWeight.toString())
    }
    onWeightChange(newWeight, calculatePrice(newWeight))
  }

  const estimatedPrice = calculatePrice(selectedWeight)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Select Weight</h4>
        <div className="text-sm text-gray-500">
          {formatCurrency(product.price_per_kg)}/kg
        </div>
      </div>

      {/* Preset Weight Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {PRESET_WEIGHTS.filter(w => w >= product.min_weight_g && w <= product.max_weight_g).map((weight) => (
          <button
            key={weight}
            onClick={() => handlePresetWeight(weight)}
            className={`weight-picker-button ${
              !isCustom && selectedWeight === weight ? 'active' : ''
            }`}
          >
            {formatWeight(weight)}
          </button>
        ))}
      </div>

      {/* Custom Weight Input */}
      <div className="space-y-2">
        <button
          onClick={() => setIsCustom(true)}
          className={`w-full weight-picker-button ${isCustom ? 'active' : ''}`}
        >
          Custom Weight
        </button>
        
        {isCustom && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustWeight(-50)}
              disabled={selectedWeight <= product.min_weight_g}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <input
                type="number"
                value={customWeight}
                onChange={(e) => handleCustomWeight(e.target.value)}
                placeholder={`${product.min_weight_g}-${product.max_weight_g}g`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min={product.min_weight_g}
                max={product.max_weight_g}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                g
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustWeight(50)}
              disabled={selectedWeight >= product.max_weight_g}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Weight Range Info */}
      <div className="text-xs text-gray-500 text-center">
        Min: {formatWeight(product.min_weight_g)} • Max: {formatWeight(product.max_weight_g)}
      </div>

      {/* Price Estimate */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Estimated Price</div>
            <div className="text-lg font-semibold text-blue-900">
              {formatCurrency(estimatedPrice)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Selected Weight</div>
            <div className="font-medium text-blue-900">
              {formatWeight(selectedWeight)}
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1">
          ⚖️ Final price will be calculated based on actual weight at pickup
        </div>
      </div>
    </div>
  )
}
