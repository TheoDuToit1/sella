'use client'

import Link from 'next/link'
import { MapPin, Clock, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Merchant {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string | null
  is_active: boolean
  pickup_only: boolean
  distance: number
  delivery_fee: number
  rating: number
  delivery_time: string
  tags: string[]
}

interface MerchantGridProps {
  merchants: Merchant[]
}

export default function MerchantGrid({ merchants }: MerchantGridProps) {
  return (
    <div className="grid gap-4">
      {merchants.map((merchant) => (
        <Link key={merchant.id} href={`/customer/merchant/${merchant.slug}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {merchant.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {merchant.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {merchant.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-4 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {merchant.logo_url ? (
                  <img 
                    src={merchant.logo_url} 
                    alt={merchant.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl">🏪</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{merchant.distance}km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{merchant.delivery_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{merchant.rating}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {merchant.pickup_only ? 'Pickup only' : `${formatCurrency(merchant.delivery_fee)} delivery`}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
