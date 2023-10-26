import { EventId, TEventType } from "~/config/types";
import { useEventsRequests } from "~/utils/io/events-requests";
import { logger } from "~/utils/io/logger";
import { useEventStore } from "~/stores/events";
import { useConnectionStore } from "~/stores/connections";
import { useCentrifuge } from "./io";

const CHECK_CONNECTION_INTERVAL = 10000
export const apiTransport = () => {
  const { centrifuge } = useCentrifuge()
  const eventsStore = useEventStore()
  const connectionStore = useConnectionStore()
  const {
    getAll,
    getSingle,
    deleteAll,
    deleteSingle,
    deleteByType,
    getEventRestUrl
  } = useEventsRequests()

  const getWSConnection = () => connectionStore.isConnectedWS
  const checkWSConnectionFail = (onConnectionLost: () => void) => {
    if(!getWSConnection()) {
      onConnectionLost()
    }
    setTimeout(() => {
      checkWSConnectionFail(onConnectionLost)
    }, CHECK_CONNECTION_INTERVAL)
  }

  centrifuge.on('connected', () => {
    connectionStore.addWSConnection()
  });

  centrifuge.on('disconnected', () => {
    connectionStore.removeWSConnection()
  });

  centrifuge.on('publication', (ctx) => {
    // We need to handle only events from the channel 'events' with event name 'event.received'
    if (ctx.channel === 'events' && ctx.data?.event === 'event.received') {
      const event = ctx?.data?.data || null
      eventsStore.addList([ event ]);
    }
  });

  checkWSConnectionFail(async () => {
    const events = await getAll();

    eventsStore.addList(events);
  })

  const deleteEvent = (eventId: EventId) => {
    centrifuge.rpc(`delete:api/event/${eventId}`, undefined)
      .catch((err) => {
        logger(['Delete event Error', err])

        return deleteSingle(eventId)
      })
  }

  const deleteEventsAll = () => {
    centrifuge.rpc(`delete:api/events`, undefined)
      .catch((err) => {
        logger(['Delete event Error', err])

        return deleteAll()
      })
  }

  const deleteEventsByType = (type: TEventType) => {
    centrifuge.rpc(`delete:api/events`, {type})
      .catch((err) => {
        logger(['Delete event Error', err])

        return deleteByType(type)
      })
  }

  // NOTE: works only with ws
  const rayStopExecution = (hash: string) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, {
      stop_execution: true
    })
  }

  // NOTE: works only with ws
  const rayContinueExecution = (hash: string) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, undefined)
  }

  return {
    getEventsAll: getAll,
    getEvent: getSingle,
    deleteEvent,
    deleteEventsAll,
    deleteEventsByType,
    rayStopExecution,
    rayContinueExecution,
    getUrl: getEventRestUrl,
  }
}
