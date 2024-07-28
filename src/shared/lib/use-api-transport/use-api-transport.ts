import type { RayContentLock } from "~/src/entities/ray/types";
import {useEventsStore, useConnectionStore, useProfileStore} from "../../stores";
import type { EventId, EventType } from '../../types';
import { useCentrifuge, useEventsRequests } from "../io";

let isEventsEmitted = false

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
  } = useEventsRequests()

  const getWSConnection = () => connectionStore.isConnectedWS
  // todo: move to useCentrifuge
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

        if (event && event.project === project) {
          eventsStore.addList([event]);
        }
      }
    });
  }

  if (!isEventsEmitted) {
    subscribeToEvents()
    isEventsEmitted = true
  }

  // todo: move to useCentrifuge
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

  const deleteEventsAll = () => {
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
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, createPayload())
    }

    return deleteByType(type);
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
    rayContinueExecution
  }
}
