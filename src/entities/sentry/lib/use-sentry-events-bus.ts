import { onUnmounted } from 'vue'
import { useCentrifuge } from '@/shared/lib/io'

type SentryEventCallback = () => void

const listeners = new Set<SentryEventCallback>()
let isSubscribed = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 1000

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
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        for (const cb of listeners) {
          cb()
        }
      }, DEBOUNCE_MS)
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
