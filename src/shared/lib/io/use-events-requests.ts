import type { EventId, EventType , ServerEvent } from '../../types';
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: () => Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<unknown> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteList: (uuids: EventId[]) => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: EventType) => Promise<void | Response>,
  getEventRestUrl: (param: EventId | undefined) => string
}

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

  const deleteList = (uuids: EventId[]) => fetch(getEventRestUrl(), { method: 'DELETE',  body: JSON.stringify({ uuids }) })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: EventType) => fetch(getEventRestUrl(), { method: 'DELETE', body: JSON.stringify({type}) })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  return {
    getAll,
    getSingle,
    deleteAll,
    deleteList,
    deleteSingle,
    deleteByType,
    getEventRestUrl
  }
}
