import {storeToRefs} from "pinia";
import {useEventsStore, useProfileStore} from "../../stores";
import type { EventId, EventType, ServerEvent } from '../../types';
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: () => Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<EventType> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteList: (uuids: EventId[]) => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: EventType) => Promise<void | Response>,
}

// TODO: add 403 response handling

export const useEventsRequests: TUseEventsRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const { projects } = storeToRefs(useEventsStore())
  const { selected: project } = projects.value

  const headers = {"X-Auth-Token": token.value }
  const getEventRestUrl = (param: string): string => `${REST_API_URL}/api/event/${param}${project ? `?project=${project}` : ''}`
  const getEventsRestUrl = (): string => `${REST_API_URL}/api/events${project ? `?project=${project}` : ''}`

  const getAll = () => fetch(getEventsRestUrl(), { headers })
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
        return response as ServerEvent<EventType>
      }
      return null;
    })

  const deleteSingle = (id: EventId) => fetch(getEventRestUrl(id), {
    method: 'DELETE',
    headers,
    ...(project ? { body: JSON.stringify({project}) } : null)
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(getEventsRestUrl(), {
    method: 'DELETE',
    headers,
    ...(project ? { body: JSON.stringify({project}) } : null)
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteList = (uuids: EventId[]) => fetch(getEventsRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({uuids})
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: EventType) => fetch(getEventsRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      type,
      ...(project ? { project } : null),
    })
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
  }
}
