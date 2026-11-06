import type { PublicationContext } from 'centrifuge'
import { onUnmounted } from 'vue'
import { guardHandler, useCentrifuge } from '@/shared/lib/io'

type SentryEventCallback = () => void

const listeners = new Set<SentryEventCallback>()
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

const SENTRY_TYPES = new Set(['sentry', 'sentry-trace', 'sentry-log'])

const notify = () => {
  debounceTimer = null
  lastNotifiedAt = Date.now()
  for (const cb of listeners) {
    cb()
  }
}

// The timer is not reset by later events, so a steady stream still notifies
// at least every MIN_INTERVAL_MS (audit 1.7).
const schedule = (delay: number) => {
  if (debounceTimer) return
  debounceTimer = setTimeout(notify, delay)
}

const onPublication = (ctx: PublicationContext) => {
  const name = ctx.data?.event

  // A delete or a clear (this tab, another tab, the API) changes the lists
  // too. `event.deleted` names no type, so every Sentry list refetches.
  if (name === 'event.deleted' || name === 'events.cleared') {
    schedule(DEBOUNCE_MS)
    return
  }

  if (name !== 'event.received') return

  const type = ctx.data?.data?.type as string | undefined
  if (!type || !SENTRY_TYPES.has(type)) return

  // Wait for the burst to settle, but no longer than needed to keep
  // MIN_INTERVAL_MS since the previous notification.
  const sinceLast = Date.now() - lastNotifiedAt
  schedule(Math.max(DEBOUNCE_MS, MIN_INTERVAL_MS - sinceLast))
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
 * Calls `callback` whenever a sentry event is received via WebSocket (debounced).
 * Automatically unsubscribes on component unmount.
 */
export function onSentryEvent(callback: SentryEventCallback) {
  subscribe()
  listeners.add(callback)

  onUnmounted(() => {
    listeners.delete(callback)
  })
}
