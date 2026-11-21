import type { BroadcastChannelKind, BroadcastPayload } from '../types'

const encoder = new TextEncoder()

export const hasJsonData = (p: BroadcastPayload): boolean => 'data_json' in p

// A preview keeps the first 2 KB of the data (server preview.go); the full
// event has the rest.
export const dataBytes = (data: string): number => encoder.encode(data ?? '').length

export const isDataCut = (p: BroadcastPayload): boolean => dataBytes(p.data) < p.size

export type BroadcastProblemTone = 'error' | 'warning' | 'info'

export type BroadcastProblem = { tone: BroadcastProblemTone; text: string }

// The server's warnings (handler.go annotate), the encrypted channel and a
// failed forward, with the icon each one gets: ✕ error, ! warning, i note.
export const broadcastProblems = (p: BroadcastPayload): BroadcastProblem[] => {
  const out: BroadcastProblem[] = (p.warnings ?? []).map((text) => ({
    tone: /not JSON|no channel/i.test(text) ? 'error' : 'warning',
    text
  }))
  if (p.encrypted) {
    out.push({
      tone: 'info',
      text: 'Encrypted channel: the data is ciphertext, Buggregator cannot read it.'
    })
  }
  if (p.upstream?.error) {
    out.push({ tone: 'error', text: `Forward to ${p.upstream.url} failed: ${p.upstream.error}` })
  } else if (p.upstream?.status && p.upstream.status >= 400) {
    out.push({ tone: 'warning', text: `${p.upstream.url} answered ${p.upstream.status}` })
  }
  return out
}

export const PROBLEM_ICON: Record<BroadcastProblemTone, string> = { error: '✕', warning: '!', info: 'i' }

// The same prefixes as the server (handler.go channelKind).
export const channelKind = (name: string): BroadcastChannelKind => {
  if (name.startsWith('private-encrypted-')) return 'encrypted'
  if (name.startsWith('private-')) return 'private'
  if (name.startsWith('presence-')) return 'presence'
  if (name.startsWith('#server-to-user-')) return 'user'
  return 'public'
}

// The kind is written out, not only coloured: «private», «#» for public.
export const channelKindLabel = (kind: BroadcastChannelKind): string => (kind === 'public' ? '#' : kind)

// The name without the prefix its kind label already says.
export const channelShortName = (name: string): string =>
  name.replace(/^(private-encrypted-|private-|presence-|#server-to-user-)/, '') || name

// A curl that sends the same event again. The signature cannot be made here
// (the secret stays on the server): with a secret configured the copy shows
// «signature does not match», and is stored all the same.
export const buildBroadcastCurl = (origin: string, p: BroadcastPayload): string => {
  const body: Record<string, unknown> = { name: p.name, channels: p.channels, data: p.data }
  if (p.socket_id) body.socket_id = p.socket_id
  const query = `auth_key=${encodeURIComponent(p.auth_key || 'app-key')}&auth_signature=resent`
  const url = `${origin.replace(/\/$/, '')}/apps/${encodeURIComponent(p.app_id || 'app')}/events?${query}`
  const json = JSON.stringify(body).replace(/'/g, `'\\''`)
  return `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${json}'`
}
