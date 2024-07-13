import type { RayContentLock } from "~/src/entities/ray/types";
import {useEventsStore, useConnectionStore, useProfileStore} from "../../stores";
import type { EventId, EventType } from '../../types';
import { useCentrifuge, useEventsRequests } from "../io";

let isEventsEmitted = false

export const useApiTransport = () => {
  const { token } = storeToRefs(useProfileStore())

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
    getEventRestUrl
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
      if (ctx.channel === 'events' && ctx.data?.event === 'event.received') {
        const event = ctx?.data?.data || null
        eventsStore.addList([event]);
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
      return centrifuge.rpc(`delete:api/event/${eventId}`, {token: token.value})
    }

    return deleteSingle(eventId);
  }

  const deleteEventsAll = () => {
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, {token: token.value})
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
      return centrifuge.rpc(`delete:api/events`, {uuids, token: token.value})
    }

    return deleteList(uuids);
  }

  const deleteEventsByType = (type: EventType) => {
    if (getWSConnection()) {
      return centrifuge.rpc(`delete:api/events`, {type, token: token.value})
    }

    return deleteByType(type);
  }

  // NOTE: works only with ws
  const rayStopExecution = (hash: RayContentLock["name"]) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, {
      stop_execution: true,
      token: token.value
    })
  }

  // NOTE: works only with ws
  const rayContinueExecution = (hash: RayContentLock["name"]) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, {token: token.value})
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
    getUrl: getEventRestUrl,
  }
}
