import {storeToRefs} from "pinia";
import {useEventsStore, useProfileStore} from "../../stores";
import type { EventId, EventType, ServerEvent } from '../../types';
import { REST_API_URL } from "./constants";

export class EventsLoadError extends Error {
  constructor(public readonly status: number, message = `The server answered ${status}`) {
    super(message)
    this.name = 'EventsLoadError'
  }
}

// keepPinned: the server keeps every pinned event (buggregator/server #365).
export type DeleteOptions = { keepPinned?: boolean }

type TUseEventsRequests = () => {
  getAll: () => Promise<ServerEvent<unknown>[]>,
  getSingle: (id: EventId) => Promise<ServerEvent<unknown> | null>,
  deleteAll: (options?: DeleteOptions) => Promise<void | Response>,
  deleteList: (uuids: EventId[]) => Promise<void | Response>,
  deleteSingle: (id: EventId) => Promise<void | Response>,
  deleteByType: (type: EventType, options?: DeleteOptions) => Promise<void | Response>,
  pinEvent: (id: EventId) => Promise<void | Response>,
  unpinEvent: (id: EventId) => Promise<void | Response>,
  replayHttpDump: (id: EventId) => Promise<void | Response>,
}


export const useEventsRequests: TUseEventsRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const { activeProjectKey: project, period } = storeToRefs(useEventsStore())

  // Read at request time: the token is loaded (or changed by a login) after
  // this composable was created.
  const headers = () => ({ "X-Auth-Token": token.value })
  const getEventRestUrl = (param: string): string => `${REST_API_URL}/api/event/${param}${project.value ? `?project=${project.value}` : ''}`
  // The period goes to the server as ?window=. Without it the backend returns
  // the whole project, which is tens of megabytes of JSON per project click.
  const getEventsPreviewRestUrl = (): string => {
    const params = new URLSearchParams()
    if (project.value) {
      params.set('project', project.value)
    }
    if (period.value) {
      params.set('window', period.value)
    }
    const qs = params.toString()
    return `${REST_API_URL}/api/events/preview${qs ? `?${qs}` : ''}`
  }
  const getEventsRestUrl = (): string => `${REST_API_URL}/api/events`

  // A failed load throws: an empty list would read as "no events" and wipe
  // what the page shows.
  const getAll = () => fetch(getEventsPreviewRestUrl(), { headers: headers() })
    .then(async (response) => {
      if (!response.ok) {
        throw new EventsLoadError(response.status)
      }

      const body = await response.json()

      if (!Array.isArray(body?.data)) {
        throw new EventsLoadError(response.status, 'Unexpected answer from the server')
      }

      return body.data as ServerEvent<unknown>[]
    })

  // null: the server has no such event (deleted, cleared, a wrong link).
  // Any other failure throws, so the page can tell the two apart.
  const getSingle = (id: EventId) => fetch(getEventRestUrl(id), { headers: headers() })
    .then(async (response) => {
      if (response.status === 404) {
        return null
      }
      if (!response.ok) {
        throw new EventsLoadError(response.status)
      }
      return (await response.json()) as ServerEvent<unknown>
    })

  const deleteSingle = (id: EventId) => fetch(getEventRestUrl(id), {
    method: 'DELETE',
    headers: headers(),
    ...(project.value ? { body: JSON.stringify({project: project.value }) } : null)
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  // The server clears events only through `DELETE /api/events`; the body says
  // what to clear (no `type` and no `uuids`: every event of the project).
  const deleteEvents = (body: { type?: EventType, uuids?: EventId[], keep_pinned?: boolean }) => fetch(getEventsRestUrl(), {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      ...(project.value ? { project: project.value } : null),
    })
  })
    .catch((err) => {
      console.error('Fetch Error', err)
    })

  const keepPinned = ({ keepPinned: keep = false }: DeleteOptions = {}) => (keep ? { keep_pinned: true } : {})

  const deleteAll = (options?: DeleteOptions) => deleteEvents(keepPinned(options))

  const deleteList = (uuids: EventId[]) => deleteEvents({ uuids })

  const deleteByType = (type: EventType, options?: DeleteOptions) => deleteEvents({ type, ...keepPinned(options) })

  const pinEvent = (id: EventId) => fetch(`${REST_API_URL}/api/event/${id}/pin`, {
    method: 'POST',
    headers: headers(),
  }).catch((err) => {
    console.error('Pin Error', err)
  })

  const unpinEvent = (id: EventId) => fetch(`${REST_API_URL}/api/event/${id}/pin`, {
    method: 'DELETE',
    headers: headers(),
  }).catch((err) => {
    console.error('Unpin Error', err)
  })

  const replayHttpDump = (id: EventId): Promise<void | Response> =>
    fetch(`${REST_API_URL}/api/http-dump/${id}/replay`, {
      method: 'POST',
      headers: headers(),
    }).catch((err) => {
      console.error('Replay Error', err)
    })

  return {
    getAll,
    getSingle,
    deleteAll,
    deleteList,
    deleteSingle,
    deleteByType,
    pinEvent,
    unpinEvent,
    replayHttpDump,
  }
}
