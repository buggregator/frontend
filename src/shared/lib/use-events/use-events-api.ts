import { storeToRefs } from "pinia";
import type { Ref } from 'vue';
import { useEventsStore } from "../../stores";
import type { EventId, EventType, ServerEvent } from '../../types';
import { useApiTransport } from '../use-api-transport'


export type TUseEventsApi = {
  items: Ref<ServerEvent<unknown>[]>
  getItem: (id: EventId) => Promise<ServerEvent<EventType> | null>
  getAll: () => void
  removeAll: () => void
  removeByType: (type: EventType) => void
  removeById: (id: EventId) => void
}

export const useEventsApi = (): TUseEventsApi => {
  const eventsStore = useEventsStore();

  const {
    lockedIds,
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
    const res = await deleteEventsList(uuids)

    if (res) {
      eventsStore.removeByIds(uuids);
    }
  }

  // With pins the server keeps every pinned event itself (keep_pinned), so
  // Clear also reaches events the browser has not loaded; the store keeps the
  // pinned ones locally.
  const removeAll = async () => {
    const res = await deleteEventsAll({ keepPinned: lockedIds.value.length > 0 })

    if (res) {
      eventsStore.removeAll()
    }
  }

  const removeById = async (eventId: EventId) => {
    await removeList([eventId])
  }

  const removeByType = async (eventType: EventType) => {
    const res = await deleteEventsByType(eventType, { keepPinned: lockedIds.value.length > 0 })

    if (res) {
      eventsStore.removeByType(eventType);
    }
  }

  const getAll = () => {
    getEventsAll().then((eventsList: ServerEvent<unknown>[]) => {
      if (eventsList.length) {
        eventsStore.initializeEvents(eventsList);

        // Sync pinned state from server
        const pinnedIds = eventsList
          .filter((e) => e.is_pinned)
          .map((e) => e.uuid)
        eventsStore.lockedIds = pinnedIds
      } else {
        // NOTE: clear cached events hardly
        eventsStore.removeAll();
      }
    }).catch((e) => {
      console.error(e);
    })
  }

  return {
    items: events as unknown as Ref<ServerEvent<unknown>[]>,
    getItem: getEvent,
    getAll,
    removeAll,
    removeByType,
    removeById,
  }
}
