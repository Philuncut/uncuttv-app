import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import UspSection from '@/components/home/UspSection'
import PricingSection from '@/components/home/PricingSection'
import ManifestoSection from '@/components/home/ManifestoSection'
import FilmmakersSection from '@/components/home/FilmmakersSection'
import { hasSubscriptionAccess } from '@/lib/access'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    if (await hasSubscriptionAccess(supabase, user.id)) {
      redirect(`/${locale}/films`)
    }
  }

  return (
    <main>
      <Hero />
      <UspSection />
      <ManifestoSection />
      <FilmmakersSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
