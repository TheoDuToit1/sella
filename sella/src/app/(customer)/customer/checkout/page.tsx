import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { redirect } from 'next/navigation'
import CheckoutForm from '@/components/customer/CheckoutForm'

export default async function CheckoutPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login?redirect=/customer/checkout')
  }

  // Get customer addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        
        <CheckoutForm 
          customerId={session.user.id}
          customerEmail={session.user.email!}
          addresses={addresses || []}
        />
      </div>
    </div>
  )
}
