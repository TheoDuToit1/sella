import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import MerchantSidebar from '@/components/merchant/MerchantSidebar'
import MerchantHeader from '@/components/merchant/MerchantHeader'

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login?redirect=/merchant')
  }

  // Check if user has merchant_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'merchant_admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <MerchantSidebar />
        <div className="flex-1 flex flex-col">
          <MerchantHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
