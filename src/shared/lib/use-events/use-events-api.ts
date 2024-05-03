import { storeToRefs } from "pinia";
import type { Ref } from 'vue';
import { useEventStore, useCachedIdsStore, useLockedIdsStore } from "../../stores";
import type { EventId, EventType, ServerEvent } from '../../types';
import { useApiTransport } from '../use-api-transport'


export type TUseEventsApi = {
  items: Ref<ServerEvent<unknown>[]>;
  getItem: (id: EventId) => Promise<ServerEvent<unknown> | null>
  getUrl: (id: EventId) => string
  getAll: (project: string | null) => void
  removeAll: (project: string | null) => void
  removeByType: (type: EventType, project: string | null) => void
  removeById: (id: EventId, project: string | null) => void
}

export const useEventsApi = (): TUseEventsApi => {
  const eventsStore = useEventStore();
  const cachedIdsStore = useCachedIdsStore();
  const lockedIdsStore = useLockedIdsStore();

  const {
    lockedIds,
  } = storeToRefs(lockedIdsStore)

  const {
    events,
  } = storeToRefs(eventsStore)

  const {
    deleteEventsAll,
    deleteEventsList,
    deleteEventsByType,
    getEventsAll,
    getEvent,
    getUrl,
  } = useApiTransport();

  const removeList = async (uuids: EventId[]) => {
    const res = await deleteEventsList(uuids)

    if (res) {
      eventsStore.removeByIds(uuids);
      cachedIdsStore.removeByIds(uuids);
    }
  }

  const removeAll = async (project: string | null = null) => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({uuid}) => !lockedIds.value.includes(uuid))
        .map(({uuid}) => uuid)

      await removeList(removedIds)

      return
    }

    const res = await deleteEventsAll(project)

    if (res) {
      eventsStore.removeAll()
      cachedIdsStore.removeAll()
    }
  }

  const removeById = async (eventId: EventId) => {
    await removeList([eventId])
  }

  const removeByType = async (eventType: EventType) => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({type, uuid}) => type === eventType && !lockedIds.value.includes(uuid))
        .map(({uuid}) => uuid)

      await removeList(removedIds)

      return
    }

    const res = await deleteEventsByType(eventType)

    if (res) {
      eventsStore.removeByType(eventType);
      cachedIdsStore.removeByType(eventType);
    }
  }

  const getAll = (project: string | null = null): void => {
    getEventsAll(project).then((eventsList: ServerEvent<unknown>[]) => {
      if (eventsList.length) {
        eventsStore.initialize(project, eventsList);
        cachedIdsStore.syncWithActive(project, eventsList.map(({uuid}) => uuid));
      } else {
        // NOTE: clear cached events hardly
        eventsStore.removeAll(project);
        cachedIdsStore.removeAll(project);
      }
    }).catch((err) => {
      console.error('getAll err', err);
    })
  }

  return {
    items: events as unknown as Ref<ServerEvent<unknown>[]>,
    getItem: getEvent,
    getUrl,
    getAll,
    removeAll,
    removeByType,
    removeById,
  }
}
