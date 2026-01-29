import { storeToRefs } from "pinia";
import type { Ref } from 'vue';
import { useEventsStore } from "../../stores";
import { EventTypes, type EventId, type EventType, type EventsPreviewMeta, type ServerEvent } from '../../types';
import { useApiTransport } from '../use-api-transport'


export type TUseEventsApi = {
  items: Ref<ServerEvent<unknown>[]>
  getItem: (id: EventId) => Promise<ServerEvent<EventType> | null>
  getAll: () => void
  loadMoreByType: (
    type: EventType,
    cursor?: string | null
  ) => Promise<{ meta: EventsPreviewMeta | null; data: ServerEvent<unknown>[] }>
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
    getEventsPreviewByTypePage,
    getEventsTypeCounts,
    getEvent,
  } = useApiTransport();

  const LOADING_PAGE_SIZE = 25;

  const removeList = async (uuids: EventId[]) => {
    const res = await deleteEventsList(uuids)

    if (res) {
      eventsStore.removeByIds(uuids);
    }
  }

  const removeAll = async () => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({ uuid }) => !lockedIds.value.includes(uuid))
        .map(({ uuid }) => uuid)

      await removeList(removedIds)

      return
    }

    const res = await deleteEventsAll()

    if (res) {
      eventsStore.removeAll()
    }
  }

  const removeById = async (eventId: EventId) => {
    await removeList([eventId])
  }

  const removeByType = async (eventType: EventType) => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({ type, uuid }) => type === eventType && !lockedIds.value.includes(uuid))
        .map(({ uuid }) => uuid)

      await removeList(removedIds)

      return
    }

    const res = await deleteEventsByType(eventType)

    if (res) {
      eventsStore.removeByType(eventType);
    }
  }

  const getAll = () => {
    eventsStore.initializeEvents([]);
    eventsStore.resetPreviewPagination();

    getEventsTypeCounts()
      .then((typeCounts) => {
        eventsStore.setEventCounts(typeCounts);
      })
      .catch((e) => {
        console.error(e);
        eventsStore.resetEventCounts();
      });

    Object.values(EventTypes).forEach((eventType) => {
      getEventsPreviewByTypePage(eventType, LOADING_PAGE_SIZE)
        .then(({ data, meta }) => {
          if (data.length) {
            eventsStore.mergeEvents(data, { updateCounts: false });
          }
          eventsStore.setPreviewPagination(eventType, meta);
        })
        .catch((e) => {
          console.error(e);
        })
    })
  }

  const loadMoreByType = async (eventType: EventType, cursor?: string | null) => {
    const pagination = eventsStore.previewPagination[eventType as EventTypes];
    if (!pagination?.hasMore) {
      return { meta: null, data: [] };
    }

    const requestCursor = cursor ?? pagination.cursor;
    const { data, meta } = await getEventsPreviewByTypePage(
      eventType,
      LOADING_PAGE_SIZE,
      requestCursor,
    );

    if (data.length) {
      eventsStore.mergeEvents(data, { updateCounts: false });

      if (eventsStore.cachedIds[eventType]?.length) {
        eventsStore.appendCachedIds(eventType, data.map(({ uuid }) => uuid));
      }
    }

    eventsStore.setPreviewPagination(eventType, meta);

    return { meta, data };
  }

  return {
    items: events as unknown as Ref<ServerEvent<unknown>[]>,
    getItem: getEvent,
    getAll,
    loadMoreByType,
    removeAll,
    removeByType,
    removeById,
  }
}
