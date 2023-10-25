import { EventId, ServerEvent, TEventType } from "~/config/types";
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<unknown> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: TEventType) => Promise<void | Response>,
  getRestUrl: (param: EventId | undefined) => string
}

export const useEventsRequests: TUseEventsRequests = () => {
  const getRestUrl = (param?: string) => `${REST_API_URL}/api/events${param ? `/${param}` : ''}`

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


  const getSingle = (id: EventId) => fetch(getRestUrl(id))
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>
      }
      return null;
    })

  const deleteSingle = (id: EventId) => fetch(getRestUrl(id), { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(getRestUrl(), { method: 'DELETE' })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: TEventType) => fetch(getRestUrl(), { method: 'DELETE', body: JSON.stringify({type}) })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  return {
    getAll,
    getSingle,
    deleteAll,
    deleteSingle,
    deleteByType,
    getRestUrl
  }
}
