import type { ClientEvents, PublicationContext } from 'centrifuge'
import type { EventId, ServerEvent } from '../../types'

type Emitter = {
  on<E extends keyof ClientEvents>(event: E, listener: ClientEvents[E]): unknown
  removeListener<E extends keyof ClientEvents>(event: E, listener: ClientEvents[E]): unknown
}

export type EventsStreamOptions = {
  centrifuge: Emitter
  // The project the list shows now; read at the moment it matters.
  getProject: () => string | undefined
  setConnected: (connected: boolean) => void
  // Every received event, any project (badge, new project detection).
  onReceived?: (event: ServerEvent<unknown>) => void
  addEvents: (events: ServerEvent<unknown>[]) => void
  dropEvents: (uuids: EventId[]) => void
  // Fetch the list from the server again and replace the local one.
  resync: () => Promise<unknown>
  flushInterval?: number
  resyncDelay?: number
  pollInterval?: number
}

// Live list over the WebSocket, kept honest with the server:
// - new events are batched (flushInterval) and only the current project's
//   are added, also when the project changed while they waited;
// - a delete or a clear made elsewhere (another tab, the API) reaches this
//   list: `event.deleted` drops the event, `events.cleared` carries no detail,
//   so the list is fetched again;
// - after a reconnect the list is fetched again: events that came during the
//   drop were never pushed. While disconnected it is polled over REST.
export const startEventsStream = (options: EventsStreamOptions) => {
  const {
    centrifuge,
    getProject,
    setConnected,
    onReceived,
    addEvents,
    dropEvents,
    resync,
    flushInterval = 500,
    resyncDelay = 300,
    pollInterval = 10000,
  } = options

  let buffer: ServerEvent<unknown>[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let resyncTimer: ReturnType<typeof setTimeout> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let wasConnected = false

  const runResync = () => {
    resync().catch((e) => console.error(e))
  }

  const scheduleResync = () => {
    if (resyncTimer) {
      clearTimeout(resyncTimer)
    }
    resyncTimer = setTimeout(() => {
      resyncTimer = null
      runResync()
    }, resyncDelay)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const startPolling = () => {
    if (!pollTimer) {
      pollTimer = setInterval(runResync, pollInterval)
    }
  }

  const flush = () => {
    flushTimer = null
    const project = getProject()
    const events = buffer.filter((event) => event.project === project)
    buffer = []

    if (events.length) {
      addEvents(events)
    }
  }

  const onConnected = () => {
    setConnected(true)
    stopPolling()

    if (wasConnected) {
      scheduleResync()
    }
    wasConnected = true
  }

  const onDisconnected = () => {
    setConnected(false)
    startPolling()
  }

  // Any message proves the connection is up.
  const onMessage = () => setConnected(true)

  const onPublication = (ctx: PublicationContext) => {
    const name = ctx.data?.event
    const data = ctx.data?.data

    if (name === 'event.received') {
      if (!data) return

      onReceived?.(data)

      if (data.project === getProject()) {
        buffer.push(data)
        if (!flushTimer) {
          flushTimer = setTimeout(flush, flushInterval)
        }
      }
      return
    }

    if (name === 'event.deleted') {
      if (data?.uuid && data.project === getProject()) {
        dropEvents([data.uuid])
      }
      return
    }

    if (name === 'events.cleared') {
      scheduleResync()
    }
  }

  centrifuge.on('connected', onConnected)
  centrifuge.on('connecting', onDisconnected)
  centrifuge.on('disconnected', onDisconnected)
  centrifuge.on('message', onMessage)
  centrifuge.on('publication', onPublication)

  return () => {
    centrifuge.removeListener('connected', onConnected)
    centrifuge.removeListener('connecting', onDisconnected)
    centrifuge.removeListener('disconnected', onDisconnected)
    centrifuge.removeListener('message', onMessage)
    centrifuge.removeListener('publication', onPublication)
    stopPolling()
    ;[flushTimer, resyncTimer].forEach((timer) => timer && clearTimeout(timer))
  }
}
