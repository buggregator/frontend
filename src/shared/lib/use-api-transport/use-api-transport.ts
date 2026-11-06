import { storeToRefs } from "pinia";
import {useEventsStore, useConnectionStore, useProfileStore} from "../../stores";
import type { ServerEvent } from '../../types';
import type { EventId, EventType } from '../../types';
import { type DeleteOptions, REST_API_URL, describeLoadError, useCentrifuge, useEventsRequests } from "../io";
import { useAppBadge } from "../use-app-badge";
import { useSettings } from "../use-settings";
import { startEventsStream } from "./events-stream";

// One stream per page load; a hot reload of this module stops the old one,
// otherwise every reload adds another set of listeners.
let stopEventsStream: (() => void) | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopEventsStream?.()
    stopEventsStream = null
  })
}

export const useApiTransport = () => {
  const { token } = storeToRefs(useProfileStore())
  const { activeProjectKey: project } = storeToRefs(useEventsStore())

  const createPayload = (additional?: Record<string, unknown>) => {
    const payload = {
      token: token.value,
      project: project.value
    }
    if (additional) {
      Object.assign(payload, additional)
    }
    return payload
  }

  const {centrifuge} = useCentrifuge()
  const eventsStore = useEventsStore()
  const connectionStore = useConnectionStore()
  const appBadge = useAppBadge()
  const {
    getAll,
    getSingle,
    deleteAll,
    deleteList,
    deleteSingle,
    deleteByType,
    pinEvent: pinEventRest,
    unpinEvent: unpinEventRest,
  } = useEventsRequests()

  const getWSConnection = () => connectionStore.isConnectedWS

  // Auto-detect new projects and refresh the project list.
  const detectProject = (event: ServerEvent<unknown>) => {
    if (event.project && !eventsStore.availableProjects.some((p: { key: string }) => p.key === event.project)) {
      const { api: { getProjects } } = useSettings()
      getProjects().then(({ data }) => {
        if (data) {
          eventsStore.setAvailableProjects(data)
        }
      }).catch(() => {})
    }
  }

  if (!stopEventsStream) {
    stopEventsStream = startEventsStream({
      centrifuge,
      getProject: () => project.value,
      setConnected: (connected) => (connected
        ? connectionStore.addWSConnection()
        : connectionStore.removeWSConnection()),
      onReceived: (event) => {
        detectProject(event)
        if (event.project === project.value) {
          appBadge.onEventsReceived()
        }
      },
      addEvents: (events) => eventsStore.addList(events),
      dropEvents: (uuids) => eventsStore.dropByIds(uuids),
      // A poll or a resync also tells the page whether the list is current.
      resync: async () => {
        const load = eventsStore.startListLoad()

        try {
          if (eventsStore.applyListLoad(load, await getAll())) {
            eventsStore.setListState('ready')
          }
        } catch (e) {
          if (eventsStore.failListLoad(load)) {
            eventsStore.setListState('error', describeLoadError(e))
          }
          throw e
        }
      },
    })
  }

  const deleteEvent = (eventId: EventId) => {
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/event/${eventId}`, createPayload())
    }

    return deleteSingle(eventId);
  }

  // Traces, logs and metrics of the current project; pinned errors stay.
  // Without `project` the server wipes every project's Sentry tables.
  // Resolves true when the server cleared them.
  const clearSentryTables = (): Promise<boolean> => {
    const headers = { 'X-Auth-Token': token.value }
    const params = new URLSearchParams({
      ...(project.value ? { project: project.value } : {}),
      keep_pinned: '1',
    })
    return fetch(`${REST_API_URL}/api/sentry/all?${params}`, { method: 'DELETE', headers })
      .then((response) => {
        if (!response.ok) {
          console.error('Sentry clear failed', response.status)
        }
        return response.ok
      })
      .catch((e) => {
        console.error('Sentry clear failed', e)
        return false
      })
  }

  // A clear counts only when both parts did: the events and, for Sentry, its
  // own tables. Both run together; a failed part makes the answer undefined.
  const withSentryClear = async (clearSentry: boolean, request: () => Promise<unknown>) => {
    const [sentryOk, result] = await Promise.all([
      clearSentry ? clearSentryTables() : Promise.resolve(true),
      request(),
    ])

    return sentryOk ? result : undefined
  }

  const keepPinnedPayload = ({ keepPinned = false }: DeleteOptions = {}) =>
    (keepPinned ? { keep_pinned: true } : undefined)

  const deleteEventsAll = (options?: DeleteOptions) => withSentryClear(true, () => (getWSConnection()
    ? centrifuge.rpc(`delete:api/events`, createPayload(keepPinnedPayload(options)))
    : deleteAll(options)))

  const deleteEventsList = (uuids: EventId[]) => {
    if (!uuids.length) {
      return Promise.resolve();
    }

    if (uuids.length === 1) {
      return deleteEvent(uuids[0]);
    }

    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, createPayload({ uuids }))
    }

    return deleteList(uuids);
  }

  const deleteEventsByType = (type: EventType, options?: DeleteOptions) => withSentryClear(type === 'sentry', () => (getWSConnection()
    ? centrifuge.rpc(`delete:api/events`, createPayload({ type, ...keepPinnedPayload(options) }))
    : deleteByType(type, options)))

  const pinEvent = (eventId: EventId) => {
    if (getWSConnection()) {
      return centrifuge.rpc(`post:api/event/${eventId}/pin`, createPayload())
    }
    return pinEventRest(eventId)
  }

  const unpinEvent = (eventId: EventId) => {
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/event/${eventId}/pin`, createPayload())
    }
    return unpinEventRest(eventId)
  }

  // NOTE: works only with ws
  const rayStopExecution = (hash: string) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, createPayload({ stop_execution: true }))
  }

  // NOTE: works only with ws
  const rayContinueExecution = (hash: string) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, createPayload())
  }

  return {
    getEventsAll: getAll,
    getEvent: getSingle,
    deleteEvent,
    deleteEventsAll,
    deleteEventsList,
    deleteEventsByType,
    rayStopExecution,
    rayContinueExecution,
    pinEvent,
    unpinEvent,
  }
}
