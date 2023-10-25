import { EventId, TEventType } from "~/config/types";
import { useEventsRequests } from "~/utils/io/events-requests";
import { useCentrifuge } from "./io/centrifuge";
import type { ApiConnection } from "./io/types";
import { REST_API_URL } from "./io/constants";


const { centrifuge } = useCentrifuge()
const { getAll, getSingle } = useEventsRequests()

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
  }

  const deleteEventsAll = () => {
    centrifuge.rpc(`delete:api/events`, undefined)
  }

  const deleteEventsByType = (type: TEventType) => {
    centrifuge.rpc(`delete:api/events`, {type})
  }

  const rayStopExecution = (hash: string) => {
    centrifuge.rpc(`post:api/ray/locks/${hash}`, {
      stop_execution: true
    })
  }

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
    makeEventUrl: (id: EventId) => `${REST_API_URL}/api/event/${id}`
  }
}
