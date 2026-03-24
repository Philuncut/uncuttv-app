import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import UspSection from '@/components/home/UspSection'
import PricingSection from '@/components/home/PricingSection'
import ManifestoSection from '@/components/home/ManifestoSection'

export default function HomePage() {
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
