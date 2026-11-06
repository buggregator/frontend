import { onScopeDispose } from 'vue'
import { useCentrifuge } from '@/shared/lib/io'
import type { XdebugWsMessage } from '../types'

export const XDEBUG_CHANNEL = 'xdebug'

type Listener = (message: XdebugWsMessage) => void
type Publication = { channel?: string; data?: { event?: string; data?: unknown } }

const listeners = new Set<Listener>()
const reconnectListeners = new Set<() => void>()
let subscribed = false
let connectedOnce = false

export const dispatchXdebugPublication = (ctx: Publication) => {
  if (ctx.channel !== XDEBUG_CHANNEL || !ctx.data?.event) return
  const message = ctx.data as XdebugWsMessage
  listeners.forEach((listener) => listener(message))
}

// The server subscribes every client to `xdebug` on connect, so publications
// arrive on the shared connection; one handler fans them out.
export const onXdebugMessage = (listener: Listener) => {
  if (!subscribed) {
    subscribed = true
    const { centrifuge } = useCentrifuge()
    centrifuge.on('publication', dispatchXdebugPublication)
    // Events sent while the connection was down are lost: tell the page to
    // re-read on every connect after the first.
    centrifuge.on('connected', () => {
      if (connectedOnce) reconnectListeners.forEach((listener) => listener())
      connectedOnce = true
    })
    if (centrifuge.state === 'connected') connectedOnce = true
  }
  listeners.add(listener)
  onScopeDispose(() => listeners.delete(listener))
}

export const onXdebugReconnect = (listener: () => void) => {
  reconnectListeners.add(listener)
  onScopeDispose(() => reconnectListeners.delete(listener))
}
