import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'

// Send a caught email to a real inbox through the server's outgoing SMTP
// relay (#6605, buggregator/server #476/#477).

export type SmtpRelayInfo = {
  // Release works now.
  enabled: boolean
  // A relay host is set.
  configured: boolean
  // Why a configured relay is off.
  reason?: string
  host?: string
  port?: number
  tls?: 'starttls' | 'tls' | 'none'
  // A login is set; the password never leaves the server.
  auth?: boolean
  from?: string
  allowed_recipients?: string[]
  max_recipients?: number
  // Auth is off: release works only from this machine (localhost).
  local_only?: boolean
}

// unavailable: an older server without the route (404), or it failed.
export type SmtpRelayState = 'idle' | 'loading' | 'ready' | 'unavailable'

export class ReleaseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message)
  }
}

const RECIPIENTS_KEY = 'smtp_release_to'
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/

/** Addresses typed in one field: commas, semicolons, spaces or new lines between them. */
export const parseRecipients = (text: string): { valid: string[]; invalid: string[] } => {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []
  for (const raw of text.split(/[\s,;]+/)) {
    const item = raw.trim()
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    ;(EMAIL.test(item) ? valid : invalid).push(item)
  }
  return { valid, invalid }
}

export const getStoredRecipients = (): string => {
  try {
    return window.localStorage?.getItem(RECIPIENTS_KEY) ?? ''
  } catch {
    return ''
  }
}

export const setStoredRecipients = (value: string) => {
  try {
    window.localStorage?.setItem(RECIPIENTS_KEY, value)
  } catch {
    // Private mode: the field just starts empty next time.
  }
}

/** «smtp.gmail.com:587 · STARTTLS · with login» */
export const relayAddress = (info: SmtpRelayInfo): string => {
  const parts = [info.port ? `${info.host}:${info.port}` : info.host || '']
  if (info.tls) parts.push(info.tls === 'none' ? 'no TLS' : info.tls.toUpperCase())
  parts.push(info.auth ? 'with login' : 'no login')
  return parts.filter(Boolean).join(' · ')
}

// One answer per page load: the relay is set in the config, it does not
// change while the server runs.
const info = ref<SmtpRelayInfo | null>(null)
const state = ref<SmtpRelayState>('idle')
let pending: Promise<void> | null = null

export const useSmtpRelay = () => {
  const { token } = storeToRefs(useProfileStore())
  const headers = (): Record<string, string> => ({ 'X-Auth-Token': token.value })

  const load = (force = false): Promise<void> => {
    if (pending && !force) return pending
    if (state.value === 'ready' && !force) return Promise.resolve()
    state.value = 'loading'
    pending = fetch(`${REST_API_URL}/api/smtp/relay`, { headers: headers() })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        info.value = (await res.json()) as SmtpRelayInfo
        state.value = 'ready'
      })
      .catch(() => {
        info.value = null
        state.value = 'unavailable'
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  /** Sends the message; resolves to the addresses the relay took. */
  const release = async (uuid: string, to: string[], rewriteTo: boolean): Promise<string[]> => {
    let res: Response
    try {
      res = await fetch(`${REST_API_URL}/api/smtp/release/${encodeURIComponent(uuid)}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, rewrite_to: rewriteTo })
      })
    } catch {
      throw new ReleaseError('The server cannot be reached.', 0, 'network')
    }
    const body = (await res.json().catch(() => ({}))) as {
      to?: string[]
      message?: string
      code?: string
    }
    if (!res.ok) {
      throw new ReleaseError(
        body.message || `The server answered ${res.status}.`,
        res.status,
        body.code || ''
      )
    }
    return body.to ?? to
  }

  return { info, state, load, release }
}
