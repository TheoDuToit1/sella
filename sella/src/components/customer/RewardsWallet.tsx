'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gift, Coins, History, TrendingUp } from 'lucide-react'
import { formatCurrency, calculateRewardPoints } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface RewardTransaction {
  id: string
  type: 'earn' | 'redeem' | 'expire' | 'adjust'
  points: number
  memo: string
  created_at: string
  order_id?: string
}

interface RewardsWalletProps {
  customerId: string
  showRedeemOption?: boolean
  onPointsRedeemed?: (points: number, discount: number) => void
}

export default function RewardsWallet({ 
  customerId, 
  showRedeemOption = false, 
  onPointsRedeemed 
}: RewardsWalletProps) {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<RewardTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    fetchWalletData()
  }, [customerId])

  const fetchWalletData = async () => {
    try {
      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('reward_wallets')
        .select('balance_points')
        .eq('customer_id', customerId)
        .single()

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError
      }

      setBalance(wallet?.balance_points || 0)

      // Get recent transactions
      const { data: walletData } = await supabase
        .from('reward_wallets')
        .select('id')
        .eq('customer_id', customerId)
        .single()

      if (walletData) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('reward_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemPoints = async () => {
    const pointsToRedeem = parseInt(redeemAmount)
    
    if (!pointsToRedeem || pointsToRedeem < 100) {
      alert('Minimum redemption is 100 points (R10)')
      return
    }

    if (pointsToRedeem > balance) {
      alert('Insufficient points')
      return
    }

    if (pointsToRedeem % 100 !== 0) {
      alert('Points must be redeemed in multiples of 100 (R10 increments)')
      return
    }

    setRedeeming(true)

    try {
      // Calculate discount (100 points = R10)
      const discount = pointsToRedeem / 100

      // This would typically be called during checkout
      // For now, we'll just simulate the redemption
      onPointsRedeemed?.(pointsToRedeem, discount)
      
      setRedeemAmount('')
      await fetchWalletData() // Refresh data
    } catch (error) {
      console.error('Error redeeming points:', error)
      alert('Failed to redeem points')
    } finally {
      setRedeeming(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'redeem':
        return <Gift className="h-4 w-4 text-blue-600" />
      case 'expire':
        return <History className="h-4 w-4 text-gray-600" />
      default:
        return <Coins className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-green-600'
      case 'redeem':
        return 'text-red-600'
      case 'expire':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Reward Points
          </CardTitle>
          <CardDescription>
            Earn 1% back on every order • 100 points = R10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <div className="text-3xl font-bold text-primary">{balance.toLocaleString()}</div>
              <div className="text-sm text-gray-500">points available</div>
              <div className="text-lg font-medium text-green-600">
                = {formatCurrency(balance / 100)} value
              </div>
            </div>

            {showRedeemOption && balance >= 100 && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Redeem Points</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="Enter points (min 100)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="100"
                    step="100"
                    max={balance}
                  />
                  <Button 
                    onClick={redeemPoints}
                    disabled={redeeming || !redeemAmount}
                    size="sm"
                  >
                    {redeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Redeem in R10 increments (100 points = R10 discount)
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Earning Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Complete Orders</div>
              <div className="text-sm text-gray-500">Earn 1% of order value in points</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Gift className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Refer Friends</div>
              <div className="text-sm text-gray-500">Get 500 points for each referral</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="text-sm font-medium">{transaction.memo}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
