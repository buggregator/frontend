import { storeToRefs } from "pinia";
import type { RayContentLock } from "@/entities/ray/types";
import {useEventsStore, useConnectionStore, useProfileStore} from "../../stores";
import type { ServerEvent } from '../../types';
import type { EventId, EventType } from '../../types';
import { REST_API_URL, useCentrifuge, useEventsRequests } from "../io";
import { useSettings } from "../use-settings";

let isEventsEmitted = false
let eventBuffer: ServerEvent<unknown>[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL = 500

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
  // TODO: move to useCentrifuge
  // const checkWSConnectionFail = (onConnectionLost: () => void) => {
  //   if (!getWSConnection()) {
  //     onConnectionLost()
  //   }
  //   setTimeout(() => {
  //     checkWSConnectionFail(onConnectionLost)
  //   }, CHECK_CONNECTION_INTERVAL)
  // }

  const subscribeToEvents = (): void => {
    centrifuge.on('connected', () => {
      connectionStore.addWSConnection()
    });

    centrifuge.on('disconnected', () => {
      connectionStore.removeWSConnection()
    });

    centrifuge.on('error', () => {
      connectionStore.removeWSConnection()
    })

    centrifuge.on('message', () => {
      connectionStore.addWSConnection()
    })

    centrifuge.on('publication', (ctx) => {
      // We need to handle only events from the channel 'events' with event name 'event.received'
      if (ctx.data?.event === 'event.received') {
        const event = ctx?.data?.data || null

        if (!event) return

        // Auto-detect new projects and refresh the project list
        if (event.project && !eventsStore.availableProjects.some((p: { key: string }) => p.key === event.project)) {
          const { api: { getProjects } } = useSettings()
          getProjects().then(({ data }) => {
            if (data) {
              eventsStore.setAvailableProjects(data)
            }
          }).catch(() => {})
        }

        if (event.project === project.value) {
          eventBuffer.push(event);

          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              if (eventBuffer.length > 0) {
                eventsStore.addList(eventBuffer);
                eventBuffer = [];
              }
              flushTimer = null;
            }, FLUSH_INTERVAL);
          }
        }
      }
    });
  }

  if (!isEventsEmitted) {
    subscribeToEvents()
    isEventsEmitted = true
  }

  // TODO: move to useCentrifuge
  // checkWSConnectionFail(async () => {
  //   const events = await getAll();
  //
  //   eventsStore.addList(events);
  // })

  const deleteEvent = (eventId: EventId) => {
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/event/${eventId}`, createPayload())
    }

    return deleteSingle(eventId);
  }

  const clearSentryTables = () => {
    const headers = { 'X-Auth-Token': token.value }
    fetch(`${REST_API_URL}/api/sentry/all`, { method: 'DELETE', headers }).catch(() => {})
  }

  const deleteEventsAll = () => {
    clearSentryTables()

    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, createPayload())
    }

    return deleteAll();
  }

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

  const deleteEventsByType = (type: EventType) => {
    if (type === 'sentry') {
      clearSentryTables()
    }

    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, createPayload())
    }

    return deleteByType(type);
  }

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
  const rayStopExecution = (hash: RayContentLock["name"]) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, createPayload({ stop_execution: true }))
  }

  // NOTE: works only with ws
  const rayContinueExecution = (hash: RayContentLock["name"]) => {
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
