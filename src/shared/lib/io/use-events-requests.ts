import { useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import type { EventId, EventType, ServerEvent } from '../../types';
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

// TODO: add 403 response handling

export const useEventsRequests: TUseEventsRequests = () => {
  const app = useNuxtApp()
  const {token} = app.$authToken ?? {token: null}
  const headers = {"X-Auth-Token": token || ''}
  const getEventRestUrl = (param?: string): string => `${REST_API_URL}/api/event${param ? `/${param}` : 's'}`

  const getAll = () => fetch(getEventRestUrl(), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as ServerEvent<unknown>[]
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return [];
      }

      console.error('Fetch Error')

      return [];
    })
    .then((events: ServerEvent<unknown>[]) => events)

  const getSingle = (id: EventId) => fetch(getEventRestUrl(id), {headers})
    .then((response) => response.json())
    .then((response) => {
      if (response) {
        return response as ServerEvent<unknown>
      }
      return null;
    })

  const deleteSingle = (id: EventId) => fetch(getEventRestUrl(id), {method: 'DELETE', headers})
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(getEventRestUrl(), {method: 'DELETE', headers})
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteList = (uuids: EventId[]) => fetch(getEventRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({uuids})
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: EventType) => fetch(getEventRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({type})
  })
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
