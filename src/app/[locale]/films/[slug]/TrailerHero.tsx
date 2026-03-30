'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function TrailerHero({ trailerPlaybackId, paused }: { trailerPlaybackId: string; paused?: boolean }) {
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

    // Resume playback after screen lock / app background (aggressive iOS strategy)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && videoRef.current) {
        const v = videoRef.current
        const pos = v.currentTime
        v.load()
        v.currentTime = pos
        v.play().catch(() => {})
      }
    }
    const onPageShow = () => {
      if (videoRef.current) {
        videoRef.current.load()
        videoRef.current.play().catch(() => {})
      }
    }
    const onTouch = () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onPageShow)
    document.addEventListener('touchstart', onTouch, { passive: true })

    return () => {
      hls?.destroy()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onPageShow)
      document.removeEventListener('touchstart', onTouch)
    }
  }, [trailerPlaybackId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }, [paused])

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
