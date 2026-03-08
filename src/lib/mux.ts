import Mux from '@mux/mux-node'

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

// Signed Playback URL generieren (für 18+ geschützte Inhalte)
export async function getSignedPlaybackUrl(playbackId: string): Promise<string> {
  const token = await mux.jwt.signPlaybackId(playbackId, {
    type: 'video',
    expiration: '1h',
  })
  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
}

// Thumbnail URL
export function getThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640`
}
