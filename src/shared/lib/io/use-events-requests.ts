import {storeToRefs} from "pinia";
import {useEventsStore, useProfileStore} from "../../stores";
import type { EventId, EventType, EventTypeCount, EventsPreviewMeta, ServerEvent } from '../../types';
import { REST_API_URL } from "./constants";

type TUseEventsRequests = () => {
  getAll: () => Promise<ServerEvent<unknown>[]>,
  getPreviewPageByType: (
    type: EventType,
    limit: number,
    cursor?: string | null
  ) => Promise<{ data: ServerEvent<unknown>[]; meta: EventsPreviewMeta | null }>,
  getTypeCounts: () => Promise<EventTypeCount[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<EventType> | null>,
  deleteAll: () => Promise<void | Response>,
  deleteList: (uuids: EventId[]) => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: EventType) => Promise<void | Response>,
}

// TODO: add 403 response handling

export const useEventsRequests: TUseEventsRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const { activeProjectKey: project } = storeToRefs(useEventsStore())

  const headers = {"X-Auth-Token": token.value }
  const getEventRestUrl = (param: string): string => `${REST_API_URL}/api/event/${param}${project.value ? `?project=${project.value}` : ''}`
  const getEventsPreviewRestUrl = (): string => `${REST_API_URL}/api/events/preview${project.value ? `?project=${project.value}` : ''}`
  const getEventsPreviewByTypeRestUrl = (
    type: EventType,
    limit: number,
    cursor?: string | null
  ): string => {
    const params = new URLSearchParams({
      type,
      limit: String(limit),
      ...(project.value ? { project: project.value } : {}),
    })

    if (cursor) {
      params.set('cursor', cursor)
    }

    return `${REST_API_URL}/api/events/preview?${params.toString()}`
  }
  const getEventsTypeCountsRestUrl = (): string =>
    `${REST_API_URL}/api/events/type-counts${project.value ? `?project=${project.value}` : ''}`

  const getAll = () => fetch(getEventsPreviewRestUrl(), { headers })
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

  const getPreviewPageByType = (type: EventType, limit: number, cursor?: string | null) =>
    fetch(getEventsPreviewByTypeRestUrl(type, limit, cursor), { headers })
      .then((response) => response.json())
      .then((response) => {
        if (response?.data) {
          return {
            data: response.data as ServerEvent<unknown>[],
            meta: (response.meta ?? null) as EventsPreviewMeta | null,
          }
        }

        if (response?.code === 403) {
          console.error('Forbidden')
          return { data: [], meta: null }
        }

        console.error('Fetch Error')

        return { data: [], meta: null }
      })

  const getTypeCounts = () => fetch(getEventsTypeCountsRestUrl(), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data as EventTypeCount[]
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return [];
      }

      console.error('Fetch Error')

      return [];
    })
    .then((counts: EventTypeCount[]) => counts)

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
    ...(project.value ? { body: JSON.stringify({project: project.value }) } : null)
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteAll = () => fetch(getEventsPreviewRestUrl(), {
    method: 'DELETE',
    headers,
    ...(project.value ? { body: JSON.stringify({project: project.value}) } : null)
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteList = (uuids: EventId[]) => fetch(getEventsPreviewRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({uuids})
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const deleteByType = (type: EventType) => fetch(getEventsPreviewRestUrl(), {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      type,
      ...(project.value ? { project: project.value } : null),
    })
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  return {
    getAll,
    getPreviewPageByType,
    getTypeCounts,
    getSingle,
    deleteAll,
    deleteList,
    deleteSingle,
    deleteByType,
  }
}
