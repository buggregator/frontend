import { REST_API_URL } from '@/shared/lib/io'

// The agents panel's server API (#7114, server PR #506): /api/assist*.

export type AssistMessage = {
  from: 'you' | 'agent'
  role?: string
  project?: string
  text: string
  at: string
  // The first message: the context as it was sent.
  context?: boolean
}

export type AssistThread = {
  id: number
  kind: 'event' | 'page'
  key: string
  title?: string
  project: string
  conversation: string
  created_at?: string
  updated_at?: string
  // The address the thread was started with ("" for older threads).
  to?: string
  messages: AssistMessage[]
}

export type AssistSummary = {
  id: number
  kind: 'event' | 'page'
  key: string
  title?: string
  project?: string
  updated_at?: string
  last_from?: 'you' | 'agent'
  to?: string
}

// Who a question may go to (the pass's h2a list).
export type AssistRecipient = { address: string; name: string; about?: string }

export type AssistStatus = {
  enabled: boolean
  status: 'connecting' | 'connected' | 'stopped'
  reason?: string
  project?: string
  to: string
  // When connected: who may get a new thread's question, and the default.
  recipients?: AssistRecipient[]
  default?: string
  limits?: { text_bytes?: number; frames_per_minute?: number; messages_per_day?: number; queue?: number }
  mcp?: { on?: boolean; read_only?: boolean; transport?: 'socket' | 'http' }
}

export type AssistStartBody = {
  context: { kind: 'event' | 'page'; key: string; title?: string; text?: string; project?: string }
  text?: string
  new?: boolean
  to?: string
}

export type AssistError = Error & { status: number; code?: string; thread?: AssistThread }

const BASE = `${REST_API_URL}/api/assist`

export const assistRequest = async <T>(token: string, path: string, init: RequestInit = {}): Promise<T> => {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' }
    })
  } catch {
    throw Object.assign(new Error('No connection to Buggregator.'), { status: 0, code: 'network' }) as AssistError
  }
  // The module off (or an older server): the SPA fallback answers 200 with
  // HTML. Not JSON = no API.
  const body = await res.json().catch(() => null)
  if (body === null || typeof body !== 'object') {
    throw Object.assign(new Error(`Request failed: ${res.status}`), { status: 404, code: 'assist_off' }) as AssistError
  }
  if (!res.ok) {
    throw Object.assign(new Error(body.error || `Request failed: ${res.status}`), {
      status: res.status,
      code: body.code,
      thread: body.thread
    }) as AssistError
  }
  return body as T
}

// What the person reads when a send fails: what happened and what to do.
export const assistErrorText = (e: unknown, project = ''): string => {
  const err = e as AssistError
  const where = project ? ` in project ${project}` : ''
  switch (err?.code) {
    case 'network':
      return 'Not sent: no connection to Buggregator.'
    case 'assist_offline':
    case 'assist_off':
      return 'Not sent: Buggregator is not connected to harnsy right now.'
    case 'assist_timeout':
      return 'Not sent: harnsy did not take the message in time.'
    case 'h2a_rate':
    case 'h2a_daily':
      return 'Not sent: too many questions for now. Try again later.'
    case 'h2a_no_holder':
      return `Not sent: nobody is available to answer${where}.`
    case 'text_required':
      return 'Write a question first.'
    case 'text_too_long':
      return 'Not sent: the question is too long. Make it shorter.'
    case 'bad_recipient':
      return 'Not sent: that recipient is not available now. Pick another one.'
    case 'event_not_found':
      return 'Not sent: this event is gone (deleted or cleared).'
    case 'bad_context':
      return 'Not sent: the panel could not tell what this page is.'
    case 'context_too_long':
    case 'body_too_large':
      return 'Not sent: this page is too big to send.'
    default:
      return `Not sent: ${err?.message || 'the request failed'}.`
  }
}
