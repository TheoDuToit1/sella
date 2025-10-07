import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import CustomerNavigation from '@/components/customer/CustomerNavigation'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login?redirect=/customer')
  }

  // Check if user has customer role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'customer') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavigation />
      <main className="pb-16">
        {children}
      </main>
    </div>
  )
}
