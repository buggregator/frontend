import { onUnmounted } from 'vue'
import { useCentrifuge } from '@/shared/lib/io'

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

function subscribe() {
  if (isSubscribed) return
  isSubscribed = true

  const { centrifuge } = useCentrifuge()

  centrifuge.on('publication', (ctx) => {
    if (ctx.data?.event !== 'event.received') return

    const event = ctx?.data?.data
    if (!event) return

    // Notify listeners when a sentry-related event arrives.
    const type = event.type as string
    if (type === 'sentry' || type === 'sentry-trace' || type === 'sentry-log') {
      // Debounce: if multiple events arrive in quick succession,
      // only call listeners once after the burst settles.
      if (debounceTimer) return

      // Wait for the burst to settle, but no longer than needed to keep
      // MIN_INTERVAL_MS since the previous notification.
      const sinceLast = Date.now() - lastNotifiedAt
      const delay = Math.max(DEBOUNCE_MS, MIN_INTERVAL_MS - sinceLast)

      debounceTimer = setTimeout(() => {
        debounceTimer = null
        lastNotifiedAt = Date.now()
        for (const cb of listeners) {
          cb()
        }
      }, delay)
    }
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
