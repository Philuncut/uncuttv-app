import { NextRequest, NextResponse } from 'next/server'
import { onlyPublished } from '@/lib/films'
import Mux from '@mux/mux-node'
import { userHasVoucherForFilm } from '@/lib/vouchers'
import { resolveRequestUser } from '@/lib/api-auth'
import { hasComplimentaryMembershipFor, hasSubscriptionAccess } from '@/lib/access'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

function normalizeCountryArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((v) => v.trim()).filter(Boolean)
}

function isFilmAllowedForCountry(film: { allowed_in?: unknown; blocked_in?: unknown }, country: string): boolean {
  if (!country) return true
  const allowedIn = normalizeCountryArray(film.allowed_in)
  const blockedIn = normalizeCountryArray(film.blocked_in)

  // New logic:
  // - If allowed_in is not empty AND country is NOT in allowed_in → block
  // - If allowed_in is empty → fall back to blocked_in logic (country in blocked_in → block)
  // - If both are empty → allow
  if (allowedIn.length > 0) return allowedIn.includes(country)
  if (blockedIn.length > 0) return !blockedIn.includes(country)
  return true
}

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? ''

  // Cookie-Sitzung (Web) oder Bearer-Token (TV, Mobil). Das Verfahren steht
  // in lib/api-auth.ts und wird von /api/watchtime mitbenutzt.
  const { user, admin: adminDb } = await resolveRequestUser(req, 'mux/token')

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // adminDb ist der Service-Role-Client -- auth.uid() ist hier null. Deshalb
  // die Fassung mit Nutzerkennung, sonst waere die Mitgliedschaft hier immer
  // false und der Rechteinhaber bekaeme kein Abspieltoken.
  const hasSubscription =
    (await hasSubscriptionAccess(adminDb, user.id)) ||
    (await hasComplimentaryMembershipFor(adminDb, user.id))

  const playbackId = req.nextUrl.searchParams.get('playbackId')
  const filmId = req.nextUrl.searchParams.get('filmId')

  if (!playbackId) {
    return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 })
  }

  // Veroeffentlichung und Territorium serverseitig, damit ein direkter Aufruf
  // mit bekannter Playback-ID an beidem nicht vorbeikommt.
  //
  // Die Abfrage haengt nur noch am Film, nicht mehr zusaetzlich am Land: war
  // kein Land bekannt, fand vorher ueberhaupt keine Pruefung statt, und ein
  // noch nicht veroeffentlichter Film liess sich abspielen. Das Territorium
  // wird weiterhin nur geprueft, wenn ein Land vorliegt.
  if (filmId) {
    const { data: film } = await onlyPublished(
      adminDb.from('films').select('id, allowed_in, blocked_in')
    )
      .eq('id', filmId)
      .maybeSingle()

    if (!film) {
      return NextResponse.json({ error: 'Film not found' }, { status: 403 })
    }

    if (country && !isFilmAllowedForCountry(film, country)) {
      return NextResponse.json({ error: 'No access in your territory' }, { status: 403 })
    }
  }

  if (!hasSubscription && filmId) {
    const hasVoucher = await userHasVoucherForFilm(user.id, filmId)
    if (!hasVoucher) {
      return NextResponse.json({ error: 'No access' }, { status: 403 })
    }
  }

  const token = await mux.jwt.signPlaybackId(playbackId, {
    keyId: process.env.MUX_SIGNING_KEY_ID!,
    keySecret: process.env.MUX_SIGNING_PRIVATE_KEY!,
    expiration: '6h',
    type: 'video',
  })

  return NextResponse.json({ token })
}