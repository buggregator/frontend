import type { ServerEvent } from '@/shared/types'

// One event the app sent to a Pusher-compatible server (Laravel Reverb,
// Pusher, soketi), as the server's broadcast module stores it
// (server modules/broadcast/handler.go, type Event).
export type BroadcastChannelKind = 'public' | 'private' | 'presence' | 'encrypted' | 'user'

export type BroadcastSignature = 'valid' | 'invalid' | 'not_checked'

// The result of forwarding the request to the real server (broadcast.upstream).
export interface BroadcastUpstream {
  url: string
  status?: number
  time_ms: number
  error?: string
}

export interface BroadcastPayload {
  app_id: string
  name: string
  channels: string[]
  // Per channel, by its prefix.
  channel_kinds: BroadcastChannelKind[]
  // As sent: a string, JSON in most apps. Cut to 2 KB in a preview.
  data: string
  // `data` parsed. Missing when it is not JSON, or in a preview of a large
  // event (the full event has it). `null` is JSON null.
  data_json?: unknown
  encrypted?: boolean
  // Sent to everyone but this socket (toOthers()).
  socket_id?: string
  info?: string
  auth_key?: string
  signature: BroadcastSignature
  // Bytes of `data`.
  size: number
  warnings: string[]
  // X-Pusher-Library: the client that sent it.
  library?: string
  batch_id?: string
  batch_size?: number
  upstream?: BroadcastUpstream
}

export type BroadcastEvent = ServerEvent<BroadcastPayload>
