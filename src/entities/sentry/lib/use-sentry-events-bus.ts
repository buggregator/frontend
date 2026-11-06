import type { PublicationContext } from 'centrifuge'
import { onUnmounted } from 'vue'
import { guardHandler, useCentrifuge } from '@/shared/lib/io'

type SentryEventCallback = () => void

/**
 * What arrived: an error event (its "event.received"), or structured rows the
 * server stored without a feed event ("sentry.stored", buggregator/server#359).
 */
export type SentryKind = 'error' | 'log' | 'metric' | 'trace'

const ALL_KINDS: readonly SentryKind[] = ['error', 'log', 'metric', 'trace']

const listeners = new Map<SentryEventCallback, readonly SentryKind[]>()
const pendingKinds = new Set<SentryKind>()
let isSubscribed = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastNotifiedAt = 0
const DEBOUNCE_MS = 1000

// Minimum interval between notifications to subscribers.
//
// A 1s debounce is not enough on its own: on a live stream events never stop
// arriving, so a burst never settles and the lists were refetched about once a
// second, which showed up as a flickering UI. The set of exception groups
// changes slowly (it is mostly counters going up), so ten seconds is fresh
// enough.
const MIN_INTERVAL_MS = 10000

// Calls each listener once if one of its kinds arrived since the last notification.
const notify = () => {
  debounceTimer = null
  lastNotifiedAt = Date.now()

  const arrived = [...pendingKinds]
  pendingKinds.clear()

  for (const [cb, kinds] of listeners) {
    if (kinds.some((kind) => arrived.includes(kind))) {
      cb()
    }
  }
}

// The timer is not reset by later events, so a steady stream still notifies
// at least every MIN_INTERVAL_MS (audit 1.7).
const schedule = (kinds: readonly SentryKind[], delay: number) => {
  for (const kind of kinds) pendingKinds.add(kind)
  if (debounceTimer) return
  debounceTimer = setTimeout(notify, delay)
}

// The kinds a stored notice names; unknown ones are left out.
const storedKinds = (kinds: unknown): SentryKind[] =>
  Array.isArray(kinds) ? kinds.filter((kind): kind is SentryKind => ALL_KINDS.includes(kind as SentryKind)) : []

const onPublication = (ctx: PublicationContext) => {
  const name = ctx.data?.event

  // A delete or a clear (this tab, another tab, the API) changes the lists
  // too. `event.deleted` names no type, so every Sentry list refetches.
  if (name === 'event.deleted' || name === 'events.cleared') {
    schedule(ALL_KINDS, DEBOUNCE_MS)
    return
  }

  let kinds: SentryKind[] = []
  if (name === 'event.received' && ctx.data?.data?.type === 'sentry') {
    kinds = ['error']
  } else if (name === 'sentry.stored') {
    kinds = storedKinds(ctx.data?.data?.kinds)
  }
  if (kinds.length === 0) return

  // Wait for the burst to settle, but no longer than needed to keep
  // MIN_INTERVAL_MS since the previous notification.
  const sinceLast = Date.now() - lastNotifiedAt
  schedule(kinds, Math.max(DEBOUNCE_MS, MIN_INTERVAL_MS - sinceLast))
}

// An exception in a handler would stop the client for good (centrifuge-js 5.8).
const guardedPublication = guardHandler('publication', onPublication)

function subscribe() {
  if (isSubscribed) return
  isSubscribed = true

  useCentrifuge().centrifuge.on('publication', guardedPublication)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    useCentrifuge().centrifuge.removeListener('publication', guardedPublication)
    if (debounceTimer) clearTimeout(debounceTimer)
  })
}

/**
 * Subscribe to real-time sentry event notifications.
 * Calls `callback` whenever something of one of `kinds` is received via
 * WebSocket (debounced) - by default of any kind. A delete or a clear counts
 * as every kind.
 * Automatically unsubscribes on component unmount.
 */
export function onSentryEvent(callback: SentryEventCallback, kinds: readonly SentryKind[] = ALL_KINDS) {
  subscribe()
  listeners.set(callback, kinds)

  onUnmounted(() => {
    listeners.delete(callback)
  })
}
