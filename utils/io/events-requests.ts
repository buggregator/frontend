import { EventId, ServerEvent, TEventType } from "~/config/types";
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<unknown> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: TEventType) => Promise<void | Response>,
}

export const useEventsRequests: TUseEventsRequests = () => {
  const getAll: Promise<ServerEvent<unknown>[]> = fetch(`${REST_API_URL}/api/events`)
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>[]
      }

      console.error('Fetch Error')

      return [];
    })
    .then((events: ServerEvent<unknown>[]) => events)


  const getSingle = (id: EventId) => fetch(`${REST_API_URL}/api/event/${id}`)
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>
      }
      return null;
    })

  const deleteSingle = (id: EventId) => fetch(`${REST_API_URL}/api/event/${id}`, { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(`${REST_API_URL}/api/events`, { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: TEventType) => fetch(`${REST_API_URL}/api/events`, { method: 'DELETE', body: JSON.stringify({type}) })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  return {
    getAll,
    getSingle,
    deleteAll,
    deleteSingle,
    deleteByType
  }
}
