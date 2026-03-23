// app/api/notify-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { filmakerId, filmakerName, filmakerEmail, files } = await req.json()

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const NOTIFY_EMAIL = process.env.UPLOAD_NOTIFY_EMAIL ?? 'office@uncuttv.at'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY nicht gesetzt')
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    function formatBytes(bytes: number) {
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
    }

    const folderLabels: Record<string, string> = {
      video: '🎬 Videodatei',
      artwork: '🖼️ Artwork',
      subs: '💬 Untertitel',
      epk: '📄 EPK / Metadaten',
    }

    const fileList = files
      .map((f: { name: string; folder: string; size: number }) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #2a2a35;">${folderLabels[f.folder] ?? f.folder}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #2a2a35;font-family:monospace;">${f.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #2a2a35;color:#888;">${formatBytes(f.size)}</td>
        </tr>`
      )
      .join('')

    const html = `
      <div style="background:#0d0d0f;color:#e2e8f0;font-family:system-ui,sans-serif;padding:32px;max-width:600px;margin:0 auto;border-radius:12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;color:#c0392b;text-transform:uppercase;margin-bottom:8px;">UncutTV Filmmaker Portal</div>
        <h1 style="font-size:20px;font-weight:600;margin:0 0 24px 0;color:#f1f5f9;">Neuer Filmmaker-Upload</h1>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#111115;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:8px 12px;color:#94a3b8;font-size:13px;">Filmmaker</td>
            <td style="padding:8px 12px;font-size:13px;">${filmakerName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#94a3b8;font-size:13px;">E-Mail</td>
            <td style="padding:8px 12px;font-size:13px;">${filmakerEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#94a3b8;font-size:13px;">User ID</td>
            <td style="padding:8px 12px;font-size:13px;font-family:monospace;font-size:11px;">${filmakerId}</td>
          </tr>
        </table>

        <h2 style="font-size:13px;font-weight:600;color:#c0392b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Hochgeladene Dateien</h2>
        <table style="width:100%;border-collapse:collapse;background:#111115;border-radius:8px;overflow:hidden;font-size:13px;">
          <thead>
            <tr style="background:#1a1a22;">
              <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-weight:500;">Typ</th>
              <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-weight:500;">Dateiname</th>
              <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-weight:500;">Größe</th>
            </tr>
          </thead>
          <tbody>${fileList}</tbody>
        </table>

        <div style="margin-top:24px;padding:16px;background:#1a0f10;border:1px solid rgba(192,57,43,0.3);border-radius:8px;font-size:13px;color:#e2e8f0;">
          Bitte prüfe die Dateien auf dem Storage und gib den Film im Admin Portal frei.
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UncutTV Filmmaker Portal <noreply@uncuttv.at>',
        to: [NOTIFY_EMAIL],
        subject: `📥 Neuer Upload: ${filmakerName}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('notify-upload error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
