import { storeToRefs } from "pinia";
import type { Ref } from 'vue';
import { useEventsStore } from "../../stores";
import type { EventId, EventType, ServerEvent } from '../../types';
import { describeLoadError, isRequestOk } from '../io/request-result';
import { useApiTransport } from '../use-api-transport'
import { showToast } from '../use-keyboard-nav';


export type TUseEventsApi = {
  items: Ref<ServerEvent<unknown>[]>
  getItem: (id: EventId) => Promise<ServerEvent<EventType> | null>
  getAll: () => Promise<void>
  removeAll: () => Promise<boolean>
  removeByType: (type: EventType) => Promise<boolean>
  removeById: (id: EventId) => Promise<boolean>
  removeList: (uuids: EventId[]) => Promise<boolean>
}

// A write that fails leaves the list as it is and says so: the list must show
// what the server holds, not what the click hoped for.
const settle = async (request: () => Promise<unknown>, failure: string): Promise<boolean> => {
  let result: unknown

  try {
    result = await request()
  } catch (e) {
    console.error(e)
  }

  const ok = isRequestOk(result)

  if (!ok) {
    showToast(failure, 4000)
  }

  return ok
}

export const useEventsApi = (): TUseEventsApi => {
  const eventsStore = useEventsStore();

  const {
    events,
  } = storeToRefs(eventsStore)

  const {
    deleteEventsAll,
    deleteEventsList,
    deleteEventsByType,
    getEventsAll,
    getEvent,
  } = useApiTransport();

  const removeList = async (uuids: EventId[]) => {
    if (!uuids.length) {
      return true
    }

    const ok = await settle(
      () => deleteEventsList(uuids),
      uuids.length === 1 ? 'Could not delete the event' : 'Could not delete the events',
    )

    if (ok) {
      eventsStore.removeByIds(uuids);
    }

    return ok
  }

  // The server keeps every pinned event itself (keep_pinned), so Clear also
  // reaches events the browser has not loaded. Always sent: pins made in
  // another tab or on events not loaded here are unknown to this store.
  // The store keeps the pinned ones it knows locally.
  const removeAll = async () => {
    const ok = await settle(() => deleteEventsAll({ keepPinned: true }), 'Could not clear the events')

    if (ok) {
      eventsStore.removeAll()
    }

    return ok
  }

  const removeById = (eventId: EventId) => removeList([eventId])

  const removeByType = async (eventType: EventType) => {
    const ok = await settle(
      () => deleteEventsByType(eventType, { keepPinned: true }),
      'Could not clear the events',
    )

    if (ok) {
      eventsStore.removeByType(eventType);
    }

    return ok
  }

  // Only the newest reply lands, for the project and period it was asked
  // for, merged with what changed here meanwhile (see eventsStore). The
  // sequence is the store's, shared by every page and the live stream.
  const getAll = async () => {
    const load = eventsStore.startListLoad()
    eventsStore.setListState('loading')

    try {
      if (eventsStore.applyListLoad(load, await getEventsAll())) {
        eventsStore.setListState('ready')
      }
    } catch (e) {
      console.error(e)
      if (eventsStore.failListLoad(load)) {
        eventsStore.setListState('error', describeLoadError(e))
      }
    }
  }

  return {
    items: events as unknown as Ref<ServerEvent<unknown>[]>,
    getItem: getEvent,
    getAll,
    removeAll,
    removeByType,
    removeById,
    removeList,
  }
}
