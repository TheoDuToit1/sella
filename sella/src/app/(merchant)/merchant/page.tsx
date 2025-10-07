import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, DollarSign, Clock, TrendingUp } from 'lucide-react'
import OrdersQueue from '@/components/merchant/OrdersQueue'
import RecentActivity from '@/components/merchant/RecentActivity'

export default async function MerchantDashboard() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Mock data for dashboard metrics
  const metrics = {
    todayOrders: 12,
    todayRevenue: 2450.50,
    avgOrderValue: 204.21,
    pendingOrders: 3
  }

  // Mock orders data
  const orders = [
    {
      id: '1',
      customer_name: 'John Smith',
      status: 'PLACED' as const,
      items_count: 3,
      total: 156.50,
      created_at: new Date().toISOString(),
      delivery_time: '30-45 min'
    },
    {
      id: '2',
      customer_name: 'Sarah Johnson',
      status: 'PREPARING' as const,
      items_count: 5,
      total: 289.75,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      delivery_time: '25-40 min'
    },
    {
      id: '3',
      customer_name: 'Mike Wilson',
      status: 'READY' as const,
      items_count: 2,
      total: 98.25,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      delivery_time: '20-35 min'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{metrics.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{metrics.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Orders Queue</CardTitle>
              <CardDescription>
                Manage incoming orders and update their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersQueue orders={orders} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Add New Product</CardTitle>
            <CardDescription>
              Expand your catalog with new items
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">View Analytics</CardTitle>
            <CardDescription>
              Detailed insights about your business
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Manage Promotions</CardTitle>
            <CardDescription>
              Create offers to boost sales
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
