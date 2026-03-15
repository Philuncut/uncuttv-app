import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function RootPage() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ?? ''
  const locale = acceptLanguage.includes('de') ? 'de' : 'en'
  redirect(`/${locale}`)
}
