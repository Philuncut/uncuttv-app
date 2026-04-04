import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete user data from related tables
  await admin.from('watchtime').delete().eq('user_id', user.id)
  await admin.from('subscriptions').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  // Delete the auth user
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: 'Could not delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
