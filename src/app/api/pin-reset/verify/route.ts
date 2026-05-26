import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { handleOptions, withCors } from '@/lib/api/cors'

const MAX_ATTEMPTS = 5

function json(data: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(data, init))
}

function hashCode(code: string, userId: string): string {
  return createHash('sha256').update(code + userId).digest('hex')
}

function isValidCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code)
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!bearerToken) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.getUser(bearerToken)
  if (error || !data.user) return null
  return data.user
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!isValidCodeFormat(code)) {
    return json({ error: 'invalid_format' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: row, error: selectError } = await admin
    .from('pin_reset_codes')
    .select('code_hash, expires_at, attempts')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) {
    return json({ error: 'database_error', message: selectError.message }, { status: 500 })
  }

  if (!row) {
    return json({ error: 'no_active_code' }, { status: 404 })
  }

  if (new Date(row.expires_at) < new Date()) {
    await admin.from('pin_reset_codes').delete().eq('user_id', user.id)
    return json({ error: 'code_expired' }, { status: 410 })
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from('pin_reset_codes').delete().eq('user_id', user.id)
    return json({ error: 'too_many_attempts' }, { status: 429 })
  }

  const submittedHash = hashCode(code, user.id)
  if (submittedHash !== row.code_hash) {
    const newAttempts = row.attempts + 1
    const { error: updateError } = await admin
      .from('pin_reset_codes')
      .update({ attempts: newAttempts })
      .eq('user_id', user.id)

    if (updateError) {
      return json({ error: 'database_error', message: updateError.message }, { status: 500 })
    }

    return json(
      { error: 'wrong_code', attempts_remaining: MAX_ATTEMPTS - newAttempts },
      { status: 401 }
    )
  }

  const { error: deleteError } = await admin.from('pin_reset_codes').delete().eq('user_id', user.id)
  if (deleteError) {
    return json({ error: 'database_error', message: deleteError.message }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ content_pin_hash: null, content_pin_set_at: null })
    .eq('id', user.id)

  if (profileError) {
    return json({ error: 'database_error', message: profileError.message }, { status: 500 })
  }

  return json({ success: true })
}
