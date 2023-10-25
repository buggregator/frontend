import { EventId, TEventType } from "~/config/types";
import { useEventsRequests } from "~/utils/io/events-requests";
import { logger } from "~/utils/io/logger";
import { useCentrifuge } from "./io";
import type { ApiConnection } from "./io";


const { centrifuge } = useCentrifuge()
const {
  getAll,
  getSingle,
  deleteAll,
  deleteSingle,
  deleteByType,
  getRestUrl
} = useEventsRequests()

export const apiTransport = ({onEventReceiveCb}: ApiConnection) => {
  centrifuge.on('publication', (ctx) => {
    // We need to handle only events from the channel 'events' with event name 'event.received'
    if (ctx.channel === 'events' && ctx.data?.event === 'event.received') {
      const event = ctx?.data?.data || null
      onEventReceiveCb(event)
    }
  });

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
    getUrl: getRestUrl,
  }
}
