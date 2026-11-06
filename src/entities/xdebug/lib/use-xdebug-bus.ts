import { onScopeDispose } from 'vue'
import { useCentrifuge } from '@/shared/lib/io'
import type { XdebugWsMessage } from '../types'

export const XDEBUG_CHANNEL = 'xdebug'

type Listener = (message: XdebugWsMessage) => void
type Publication = { channel?: string; data?: { event?: string; data?: unknown } }

const listeners = new Set<Listener>()
let subscribed = false

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
    useCentrifuge().centrifuge.on('publication', dispatchXdebugPublication)
  }
  listeners.add(listener)
  onScopeDispose(() => listeners.delete(listener))
}
