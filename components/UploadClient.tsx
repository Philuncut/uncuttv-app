'use client'

import { useState, useRef, useCallback } from 'react'

type FolderKey = 'video' | 'artwork' | 'subs' | 'epk'

const FOLDERS: { key: FolderKey; label: string; hint: string; accept: string; icon: string }[] = [
  {
    key: 'video',
    label: 'Videodatei',
    hint: 'Master / Deliverable (.mov, .mp4, .mxf, .mkv)',
    accept: '.mov,.mp4,.mxf,.mkv,.avi,.m4v',
    icon: '🎬',
  },
  {
    key: 'artwork',
    label: 'Poster / Artwork',
    hint: 'Key Art, Thumbnails (.jpg, .png, .tiff)',
    accept: '.jpg,.jpeg,.png,.tiff,.tif,.webp',
    icon: '🖼️',
  },
  {
    key: 'subs',
    label: 'Untertitel',
    hint: 'Deutsch & Englisch (.srt, .vtt)',
    accept: '.srt,.vtt,.ass,.ssa',
    icon: '💬',
  },
  {
    key: 'epk',
    label: 'EPK / Metadaten',
    hint: 'Pressemappe, Synopse, Cast (.pdf, .docx, .xlsx)',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
    icon: '📄',
  },
]

type FileStatus = 'idle' | 'uploading' | 'done' | 'error'

interface UploadFile {
  id: string
  file: File
  folder: FolderKey
  status: FileStatus
  progress: number
  errorMsg?: string
}

interface Props {
  filmakerId: string
  filmakerName: string
  filmakerEmail: string
}

export default function UploadClient({ filmakerId, filmakerName, filmakerEmail }: Props) {
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState<FolderKey | null>(null)
  const [uploading, setUploading] = useState(false)
  const [allDone, setAllDone] = useState(false)

  const fileInputRefs = useRef<Record<FolderKey, HTMLInputElement | null>>({
    video: null,
    artwork: null,
    subs: null,
    epk: null,
  })

  // ── Test connection via /api/upload-test ──────────────────────────────────
  async function handleConnect() {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, username, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Verbindung fehlgeschlagen')
      setConnected(true)
    } catch (e: any) {
      setConnectError(e.message)
    } finally {
      setConnecting(false)
    }
  }

  // ── Add files ─────────────────────────────────────────────────────────────
  function addFiles(folder: FolderKey, incoming: FileList | null) {
    if (!incoming) return
    const newEntries: UploadFile[] = Array.from(incoming).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      folder,
      status: 'idle',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...newEntries])
  }

  const handleDrop = useCallback((folder: FolderKey, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    addFiles(folder, e.dataTransfer.files)
  }, [])

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // ── Upload all ────────────────────────────────────────────────────────────
  async function handleUploadAll() {
    const pending = files.filter(f => f.status === 'idle')
    if (!pending.length) return
    setUploading(true)

    for (const entry of pending) {
      setFiles(prev =>
        prev.map(f => (f.id === entry.id ? { ...f, status: 'uploading', progress: 0 } : f))
      )

      try {
        await uploadFile(entry)
        setFiles(prev =>
          prev.map(f => (f.id === entry.id ? { ...f, status: 'done', progress: 100 } : f))
        )
      } catch (e: any) {
        setFiles(prev =>
          prev.map(f =>
            f.id === entry.id ? { ...f, status: 'error', errorMsg: e.message } : f
          )
        )
      }
    }

    // Notify via mail
    try {
      await fetch('/api/notify-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmakerId,
          filmakerName,
          filmakerEmail,
          files: pending.map(f => ({ name: f.file.name, folder: f.folder, size: f.file.size })),
        }),
      })
    } catch {}

    setUploading(false)
    setAllDone(true)
  }

  async function uploadFile(entry: UploadFile) {
    const formData = new FormData()
    formData.append('file', entry.file)
    formData.append('folder', entry.folder)
    formData.append('host', host)
    formData.append('username', username)
    formData.append('password', password)

    // Use XMLHttpRequest for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setFiles(prev =>
            prev.map(f => (f.id === entry.id ? { ...f, progress: pct } : f))
          )
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          try {
            const json = JSON.parse(xhr.responseText)
            reject(new Error(json.error ?? `HTTP ${xhr.status}`))
          } catch {
            reject(new Error(`HTTP ${xhr.status}`))
          }
        }
      }

      xhr.onerror = () => reject(new Error('Netzwerkfehler'))
      xhr.send(formData)
    })
  }

  const pendingCount = files.filter(f => f.status === 'idle').length
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0)

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">

      {/* ── Step 1: Credentials ── */}
      <section className="rounded-xl border border-[#2a2a35] bg-[#111115] p-6">
        <h2 className="text-sm font-semibold tracking-[0.15em] text-[#c0392b] uppercase mb-1">
          Schritt 1 — Zugangsdaten
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          WebDAV-Zugangsdaten von UncutTV – du hast diese per E-Mail erhalten.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Server (Host)</label>
            <input
              type="text"
              value={host}
              onChange={e => setHost(e.target.value)}
              disabled={connected}
              placeholder="https://u559539.your-storagebox.de"
              className="w-full rounded-md border border-[#2a2a35] bg-[#121217] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c0392b] disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={connected}
              placeholder="u559539-filmmaker-nick"
              className="w-full rounded-md border border-[#2a2a35] bg-[#121217] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c0392b] disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={connected}
              placeholder="••••••••"
              className="w-full rounded-md border border-[#2a2a35] bg-[#121217] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c0392b] disabled:opacity-50"
            />
          </div>
        </div>

        {connectError && (
          <div className="mt-3 rounded-md border border-[#c0392b]/40 bg-[#c0392b]/10 px-3 py-2 text-sm text-[#c0392b]">
            {connectError}
          </div>
        )}

        {connected ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Verbunden – du kannst jetzt Dateien hinzufügen.
            <button
              type="button"
              onClick={() => { setConnected(false); setAllDone(false); setFiles([]) }}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Zurücksetzen
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || !host || !username || !password}
            className="mt-4 rounded-md bg-[#c0392b] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#a93226] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? 'Verbinde…' : 'Verbindung testen'}
          </button>
        )}
      </section>

      {/* ── Step 2: Drop Zones ── */}
      {connected && (
        <section>
          <h2 className="text-sm font-semibold tracking-[0.15em] text-[#c0392b] uppercase mb-1">
            Schritt 2 — Dateien hinzufügen
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Dateien per Drag & Drop oder Klick in den jeweiligen Ordner ablegen.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {FOLDERS.map(folder => {
              const folderFiles = files.filter(f => f.folder === folder.key)
              const isOver = dragOver === folder.key

              return (
                <div
                  key={folder.key}
                  onDragOver={e => { e.preventDefault(); setDragOver(folder.key) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(folder.key, e)}
                  className={`rounded-xl border-2 border-dashed p-5 transition cursor-pointer
                    ${isOver
                      ? 'border-[#c0392b] bg-[#c0392b]/10'
                      : 'border-[#2a2a35] bg-[#111115] hover:border-[#3a2a2a]'
                    }`}
                  onClick={() => fileInputRefs.current[folder.key]?.click()}
                >
                  <input
                    ref={el => { fileInputRefs.current[folder.key] = el }}
                    type="file"
                    multiple
                    accept={folder.accept}
                    className="hidden"
                    onChange={e => addFiles(folder.key, e.target.files)}
                  />

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{folder.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-100 text-sm">{folder.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{folder.hint}</div>
                    </div>
                    {folderFiles.length > 0 && (
                      <span className="shrink-0 rounded-full bg-[#c0392b]/20 px-2 py-0.5 text-xs font-semibold text-[#c0392b]">
                        {folderFiles.length}
                      </span>
                    )}
                  </div>

                  {folderFiles.length > 0 && (
                    <ul className="mt-3 space-y-1" onClick={e => e.stopPropagation()}>
                      {folderFiles.map(f => (
                        <li key={f.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="truncate flex-1 text-slate-300">{f.file.name}</span>
                            <span className="text-slate-500 shrink-0">{formatBytes(f.file.size)}</span>
                            {f.status === 'idle' && (
                              <button
                                type="button"
                                onClick={() => removeFile(f.id)}
                                className="text-slate-600 hover:text-[#c0392b] shrink-0"
                              >
                                ✕
                              </button>
                            )}
                            {f.status === 'done' && <span className="text-emerald-400 shrink-0">✓</span>}
                            {f.status === 'error' && <span className="text-[#c0392b] shrink-0">✗</span>}
                          </div>
                          {f.status === 'uploading' && (
                            <div className="h-1 w-full rounded-full bg-[#2a2a35] overflow-hidden">
                              <div
                                className="h-full bg-[#c0392b] transition-all duration-200"
                                style={{ width: `${f.progress}%` }}
                              />
                            </div>
                          )}
                          {f.status === 'error' && (
                            <div className="text-xs text-[#c0392b]">{f.errorMsg}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {folderFiles.length === 0 && (
                    <p className="mt-3 text-center text-xs text-slate-600">
                      Hierher ziehen oder klicken
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Step 3: Upload ── */}
      {connected && files.length > 0 && (
        <section className="rounded-xl border border-[#2a2a35] bg-[#111115] p-6">
          <h2 className="text-sm font-semibold tracking-[0.15em] text-[#c0392b] uppercase mb-4">
            Schritt 3 — Upload starten
          </h2>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-slate-400">
              <span className="text-slate-100 font-medium">{pendingCount}</span> Datei(en) bereit ·{' '}
              <span className="text-slate-100 font-medium">{formatBytes(totalSize)}</span> gesamt
            </div>
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={uploading || pendingCount === 0}
              className="rounded-md bg-[#c0392b] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#a93226] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Upload läuft…' : 'Alle Dateien hochladen'}
            </button>
          </div>

          {allDone && (
            <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              ✓ Alle Dateien wurden erfolgreich übertragen. UncutTV wurde benachrichtigt und prüft deine Einreichung.
            </div>
          )}
        </section>
      )}

      {/* ── Info ── */}
      <p className="text-xs text-slate-600 text-center pb-4">
        Deine Dateien werden verschlüsselt übertragen und erst nach Freigabe durch UncutTV auf der Plattform veröffentlicht.
      </p>
    </div>
  )
}
