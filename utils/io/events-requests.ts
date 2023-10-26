import { EventId, ServerEvent, TEventType } from "~/config/types";
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: () => Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<unknown> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: TEventType) => Promise<void | Response>,
  getEventRestUrl: (param: EventId | undefined) => string
}

const EVENTS_GETTING_INTERVAL = 10000

export const useEventsRequests: TUseEventsRequests = () => {
  const getEventRestUrl = (param?: string) => `${REST_API_URL}/api/event${param ? `/${param}` : 's'}`

  const getAll = () => fetch(getEventRestUrl())
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>[]
      }

      console.error('Fetch Error')

      return [];
    })
    .then((events: ServerEvent<unknown>[]) => events)

  const recursiveGetEventsRequest = async (cb: (events: ServerEvent<unknown>[]) => void) => {
    const events = await getAll()

    cb(events);

    setTimeout(() => {
      recursiveGetEventsRequest(cb)
    }, EVENTS_GETTING_INTERVAL)
  }

  const getSingle = (id: EventId) => fetch(getEventRestUrl(id))
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>
      }
      return null;
    })

  const deleteSingle = (id: EventId) => fetch(getEventRestUrl(id), { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(getEventRestUrl(), { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: TEventType) => fetch(getEventRestUrl(), { method: 'DELETE', body: JSON.stringify({type}) })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  return {
    getAll,
    getSingle,
    deleteAll,
    deleteSingle,
    deleteByType,
    recursiveGetEventsRequest,
    getEventRestUrl
  }
}
