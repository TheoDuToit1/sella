'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { isValidSouthAfricanPhone, formatSouthAfricanPhone } from '@/lib/utils'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer' as 'customer' | 'merchant_admin'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.phone && !isValidSouthAfricanPhone(formData.phone)) {
      setError('Please enter a valid South African phone number')
      setLoading(false)
      return
    }

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            phone: formData.phone ? formatSouthAfricanPhone(formData.phone) : null
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role: formData.role,
            phone: formData.phone ? formatSouthAfricanPhone(formData.phone) : null
          })

        if (profileError) throw profileError

        // Create reward wallet for customers
        if (formData.role === 'customer') {
          const { error: walletError } = await supabase
            .from('reward_wallets')
            .insert({
              customer_id: data.user.id,
              balance_points: 0
            })

          if (walletError) console.error('Failed to create reward wallet:', walletError)
        }

        // Redirect to appropriate dashboard
        switch (formData.role) {
          case 'customer':
            router.push('/customer')
            break
          case 'merchant_admin':
            router.push('/merchant/onboarding')
            break
          default:
            router.push('/')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
          <span className="text-white font-bold text-lg">M60</span>
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Join Sella and discover premium local food
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInputChange('role', 'customer')}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  formData.role === 'customer'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 mx-auto mb-1" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('role', 'merchant_admin')}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  formData.role === 'merchant_admin'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 mx-auto mb-1" />
                Merchant
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., 082 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  )
}
