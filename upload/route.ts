// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Vercel max body size for hobby/pro: 4.5 MB default
// For large video files this route is ONLY used for small files (artwork, subs, EPK)
// Video files should use a separate chunked or direct upload approach
// Set this in next.config.js:
// api: { bodyParser: { sizeLimit: '500mb' } }  ← only works on custom server
// For Vercel Pro/Enterprise you can increase via vercel.json: "functions": { "app/api/upload/route.ts": { "maxDuration": 300 } }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null
    const host = formData.get('host') as string | null
    const username = formData.get('username') as string | null
    const password = formData.get('password') as string | null

    if (!file || !folder || !host || !username || !password) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 })
    }

    const baseUrl = host.replace(/\/$/, '')
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._\-() ]/g, '_')
    const targetUrl = `${baseUrl}/${folder}/${safeFilename}`

    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    // Ensure folder exists (MKCOL – idempotent, 405 = already exists = ok)
    const mkcolRes = await fetch(`${baseUrl}/${folder}/`, {
      method: 'MKCOL',
      headers: { Authorization: auth },
    })
    if (!mkcolRes.ok && mkcolRes.status !== 405 && mkcolRes.status !== 301) {
      return NextResponse.json(
        { error: `Ordner konnte nicht angelegt werden (${mkcolRes.status})` },
        { status: 502 }
      )
    }

    // Upload file via WebDAV PUT
    const fileBuffer = await file.arrayBuffer()
    const putRes = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Authorization: auth,
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': String(fileBuffer.byteLength),
      },
      body: fileBuffer,
    })

    if (!putRes.ok) {
      return NextResponse.json(
        { error: `Upload fehlgeschlagen (${putRes.status})` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, path: `/${folder}/${safeFilename}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unbekannter Fehler' }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
