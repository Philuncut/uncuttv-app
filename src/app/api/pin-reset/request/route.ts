import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomInt } from 'node:crypto'
import { handleOptions, withCors } from '@/lib/api/cors'
import { sendPinResetEmail } from '@/lib/emails'

const RATE_LIMIT_MS = 60_000
const CODE_TTL_MS = 15 * 60_000

function json(data: unknown, init?: ResponseInit) {
  return withCors(NextResponse.json(data, init))
}

function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '***@***'
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  return `${local[0]}******@${domain}`
}

function hashCode(code: string, userId: string): string {
  return createHash('sha256').update(code + userId).digest('hex')
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

  const email = user.email?.trim()
  if (!email) {
    return json({ error: 'no_email' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: existing, error: selectError } = await admin
    .from('pin_reset_codes')
    .select('created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) {
    return json({ error: 'database_error', message: selectError.message }, { status: 500 })
  }

  if (existing?.created_at) {
    const createdAt = new Date(existing.created_at).getTime()
    const elapsed = Date.now() - createdAt
    if (elapsed < RATE_LIMIT_MS) {
      const retryAfterSeconds = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
      return json(
        { error: 'too_many_requests', retry_after_seconds: retryAfterSeconds },
        { status: 429 }
      )
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const codeHash = hashCode(code, user.id)
  const now = new Date()

  const { error: upsertError } = await admin.from('pin_reset_codes').upsert(
    {
      user_id: user.id,
      code_hash: codeHash,
      expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
      attempts: 0,
      created_at: now.toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    return json({ error: 'database_error', message: upsertError.message }, { status: 500 })
  }

  const { error: emailError } = await sendPinResetEmail(email, code)
  if (emailError) {
    return json({ error: 'email_failed', message: emailError.message }, { status: 500 })
  }

  return json({ success: true, masked_email: maskEmail(email) })
}
