'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Truck, 
  BarChart3, 
  Settings, 
  Users,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/merchant', icon: LayoutDashboard },
  { name: 'Orders', href: '/merchant/orders', icon: ShoppingBag },
  { name: 'Catalog', href: '/merchant/catalog', icon: Package },
  { name: 'Delivery', href: '/merchant/delivery', icon: Truck },
  { name: 'Promotions', href: '/merchant/promotions', icon: Tag },
  { name: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
  { name: 'Customers', href: '/merchant/customers', icon: Users },
  { name: 'Settings', href: '/merchant/settings', icon: Settings },
]

export default function MerchantSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/merchant" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Sella</div>
            <div className="text-xs text-gray-500">Merchant Portal</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Business Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-900">Premium Butchery</div>
          <div className="text-xs text-gray-500">Active • Online</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Accepting orders</span>
          </div>
        </div>
      </div>
    </div>
  )
}
