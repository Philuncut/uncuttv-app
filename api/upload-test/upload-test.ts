// app/api/upload-test/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { host, username, password } = await req.json()

    if (!host || !username || !password) {
      return NextResponse.json({ error: 'Fehlende Zugangsdaten' }, { status: 400 })
    }

    const baseUrl = host.replace(/\/$/, '')

    // PROPFIND on root to test credentials
    const res = await fetch(baseUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        Depth: '0',
      },
    })

    if (res.status === 401) {
      return NextResponse.json({ error: 'Benutzername oder Passwort falsch' }, { status: 401 })
    }
    if (res.status === 404) {
      return NextResponse.json({ error: 'Server nicht gefunden – URL prüfen' }, { status: 404 })
    }
    if (!res.ok && res.status !== 207) {
      return NextResponse.json({ error: `Server antwortete mit Status ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unbekannter Fehler' }, { status: 500 })
  }
}
