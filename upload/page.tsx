// app/upload/page.tsx
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UploadClient from '@/components/UploadClient'

export default async function UploadPage() {
  const cookieStore = await cookies()
  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const name =
    (session.user?.user_metadata as any)?.name ??
    session.user?.email ??
    'Filmmaker'

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 gap-8">
        <header className="flex items-center justify-between gap-4 border-b border-[#2a2a35] pb-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-[#c0392b] uppercase">
              UncutTV
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-100">
              Hallo, {name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-[#3a2a2a] bg-[#151017] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-[#c0392b] hover:text-[#fefefe]"
            >
              ← Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full bg-[#c0392b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a93226]"
              >
                Abmelden
              </button>
            </form>
          </div>
        </header>

        <UploadClient
          filmakerId={session.user.id}
          filmakerName={name}
          filmakerEmail={session.user.email ?? ''}
        />
      </div>
    </main>
  )
}
