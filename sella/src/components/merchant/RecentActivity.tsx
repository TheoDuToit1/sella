'use client'

import { Clock, ShoppingBag, User, TrendingUp } from 'lucide-react'

const activities = [
  {
    id: '1',
    type: 'order',
    message: 'New order from Sarah Johnson',
    time: '2 minutes ago',
    icon: ShoppingBag,
    color: 'text-blue-600'
  },
  {
    id: '2',
    type: 'customer',
    message: 'Mike Wilson left a 5-star review',
    time: '15 minutes ago',
    icon: User,
    color: 'text-green-600'
  },
  {
    id: '3',
    type: 'sales',
    message: 'Daily sales target reached',
    time: '1 hour ago',
    icon: TrendingUp,
    color: 'text-purple-600'
  },
  {
    id: '4',
    type: 'order',
    message: 'Order #MS60-ABC123 delivered',
    time: '2 hours ago',
    icon: ShoppingBag,
    color: 'text-gray-600'
  }
]

export default function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon
        
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          </div>
        )
      })}
      
      <div className="pt-4 border-t border-gray-200">
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          View all activity
        </button>
      </div>
    </div>
  )
}
