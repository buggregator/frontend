import { guardHandler, useCentrifuge } from '@/shared/lib/io'
import type { UpdateState } from '../types'

// The server sends `update.progress` on every events.project.{key} channel
// the client is subscribed to: on each phase change and up to 4 times a
// second while downloading. The events stream ignores it (no event name it
// knows); this handler takes it.
export const UPDATE_PROGRESS_EVENT = 'update.progress'

type Listener = (state: UpdateState) => void
type Publication = { channel?: string; data?: { event?: string; data?: unknown } }

const listeners = new Set<Listener>()
let subscribed = false

const isState = (value: unknown): value is UpdateState =>
  !!value && typeof (value as UpdateState).phase === 'string'

export const dispatchUpdatePublication = (ctx: Publication) => {
  if (ctx.data?.event !== UPDATE_PROGRESS_EVENT || !isState(ctx.data.data)) return
  const state = ctx.data.data
  listeners.forEach((listener) => listener(state))
}

// `listen: false` only registers the listener (tests): no socket is opened.
export const onUpdateProgress = (listener: Listener, { listen = true } = {}) => {
  if (listen && !subscribed) {
    subscribed = true
    // An exception in a handler would stop the client for good (centrifuge-js 5.8).
    useCentrifuge().centrifuge.on('publication', guardHandler('publication', dispatchUpdatePublication))
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
