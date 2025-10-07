'use client'

import { useState } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocationSelector() {
  const [selectedLocation, setSelectedLocation] = useState('Sandton, Johannesburg')

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
      <MapPin className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="text-sm text-gray-600">Deliver to</div>
        <div className="font-medium text-gray-900">{selectedLocation}</div>
      </div>
      <Button variant="ghost" size="sm">
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
