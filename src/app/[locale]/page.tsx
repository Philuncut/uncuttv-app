import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import UspSection from '@/components/home/UspSection'
import PricingSection from '@/components/home/PricingSection'
import ManifestoSection from '@/components/home/ManifestoSection'
import { ACCESS_GRANTING_STATUSES } from '@/lib/access'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ACCESS_GRANTING_STATUSES)
      .limit(1)

    if (activeSubs && activeSubs.length > 0) {
      redirect(`/${locale}/films`)
    }
  }

  return (
    <main>
      <Hero />
      <UspSection />
      <ManifestoSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
