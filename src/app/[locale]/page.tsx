import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import UspSection from '@/components/home/UspSection'
import PricingSection from '@/components/home/PricingSection'
import ManifestoSection from '@/components/home/ManifestoSection'
import LabelMarquee from '@/components/home/LabelMarquee'
import FilmmakersSection from '@/components/home/FilmmakersSection'
import AppsSection from '@/components/home/AppsSection'
import { hasSubscriptionAccess } from '@/lib/access'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // Auch hier, nicht nur im Layout: Next rendert Layout und Seite nebenlaeufig,
  // die Reihenfolge ist nicht zugesichert. FilmmakersSection ist die einzige
  // Serverkomponente dieser Seite und haengt daran.
  setRequestLocale(locale)

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
      <LabelMarquee />
      <FilmmakersSection />
      <AppsSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
