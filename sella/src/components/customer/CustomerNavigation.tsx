'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/customer', icon: Home },
  { name: 'Search', href: '/customer/search', icon: Search },
  { name: 'Cart', href: '/customer/cart', icon: ShoppingBag },
  { name: 'Favorites', href: '/customer/favorites', icon: Heart },
  { name: 'Profile', href: '/customer/profile', icon: User },
]

export default function CustomerNavigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/customer" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-gray-900">Sella</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <button className="relative p-2">
                <ShoppingBag className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
