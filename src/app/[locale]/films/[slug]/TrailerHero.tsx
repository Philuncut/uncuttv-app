'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function TrailerHero({ trailerPlaybackId }: { trailerPlaybackId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const src = `https://stream.mux.com/${trailerPlaybackId}.m3u8`
    let hls: Hls | null = null

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
    }

    // Resume playback after screen lock / app background
    const resume = () => video.play().catch(() => {})
    const onVisibility = () => { if (document.visibilityState === 'visible') resume() }
    const onWebkitVisibility = () => {
      if ((document as { webkitVisibilityState?: string }).webkitVisibilityState === 'visible') resume()
    }

    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('webkitvisibilitychange', onWebkitVisibility)
    window.addEventListener('focus', resume)

    return () => {
      hls?.destroy()
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('webkitvisibilitychange', onWebkitVisibility)
      window.removeEventListener('focus', resume)
    }
  }, [trailerPlaybackId])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        filter: 'brightness(1.4)',
      }}
    />
  )
}
