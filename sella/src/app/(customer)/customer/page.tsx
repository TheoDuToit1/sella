import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import MerchantGrid from '@/components/customer/MerchantGrid'
import SearchBar from '@/components/customer/SearchBar'
import LocationSelector from '@/components/customer/LocationSelector'
import { MapPin, Clock, Star } from 'lucide-react'

export default async function CustomerHomePage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Get nearby merchants (mock data for now)
  const merchants = [
    {
      id: '1',
      name: 'Premium Butchery',
      slug: 'premium-butchery',
      description: 'Fresh, high-quality meat and specialty cuts',
      logo_url: null,
      is_active: true,
      pickup_only: false,
      distance: 1.2,
      delivery_fee: 25,
      rating: 4.8,
      delivery_time: '30-45 min',
      tags: ['Halal', 'Free Range', 'Organic']
    },
    {
      id: '2',
      name: 'Artisan Deli',
      slug: 'artisan-deli',
      description: 'Gourmet cheeses, charcuterie, and specialty foods',
      logo_url: null,
      is_active: true,
      pickup_only: false,
      distance: 2.1,
      delivery_fee: 30,
      rating: 4.6,
      delivery_time: '25-40 min',
      tags: ['Artisan', 'Imported', 'Gourmet']
    },
    {
      id: '3',
      name: 'Ocean Fresh Seafood',
      slug: 'ocean-fresh-seafood',
      description: 'Daily fresh catch and premium seafood',
      logo_url: null,
      is_active: true,
      pickup_only: false,
      distance: 3.5,
      delivery_fee: 35,
      rating: 4.9,
      delivery_time: '40-60 min',
      tags: ['Fresh', 'Sustainable', 'Daily Catch']
    }
  ]

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Good afternoon! 👋
        </h1>
        <p className="text-gray-600">
          Discover premium food from local specialists
        </p>
      </div>

      {/* Location & Search */}
      <div className="mb-6 space-y-4">
        <LocationSelector />
        <SearchBar />
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-primary text-white rounded-full text-sm whitespace-nowrap">
            All
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            Butcheries
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            Delis
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            Seafood
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            Halal
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            Free Delivery
          </button>
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="grid gap-4">
        {merchants.map((merchant) => (
          <div key={merchant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
                <span className="text-2xl">🥩</span>
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
                  R{merchant.delivery_fee} delivery
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Order Again
        </h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">
            Your recent orders will appear here
          </p>
        </div>
      </div>
    </div>
  )
}
