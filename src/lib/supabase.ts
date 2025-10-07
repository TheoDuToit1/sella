import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to check user role
export const getUserRole = async (userId: string): Promise<'customer' | 'merchant_admin' | 'driver' | 'platform_admin'> => {
  const profile = await getUserProfile(userId)
  return profile.role as 'customer' | 'merchant_admin' | 'driver' | 'platform_admin'
}

// Helper function for RPC calls
export const callSupabaseFunction = async (functionName: string, params: any = {}) => {
  const { data, error } = await supabase.rpc(functionName, params)
  if (error) throw error
  return data
}
