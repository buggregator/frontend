import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { useEventsStore } from '../../stores';
import type { EventId, EventType, ServerEvent } from '../../types';
import { useApiTransport } from '../use-api-transport';

export type TUseEventsApi = {
  items: Ref<ServerEvent<unknown>[]>;
  getItem: (id: EventId) => Promise<ServerEvent<EventType> | null>;
  getAll: () => void;
  removeAll: () => void;
  removeByType: (type: EventType) => void;
  removeById: (id: EventId) => void;
};

export const useEventsApi = (): TUseEventsApi => {
  const eventsStore = useEventsStore();

  const { lockedIds, events } = storeToRefs(eventsStore);

  const {
    deleteEventsAll, deleteEventsList, deleteEventsByType, getEventsAll, getEvent,
  } =
    useApiTransport();

  const removeList = async (uuids: EventId[]) => {
    const res = await deleteEventsList(uuids);

    if (res) {
      eventsStore.removeByIds(uuids);
    }
  };

  const removeAll = async () => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({ uuid }) => !lockedIds.value.includes(uuid))
        .map(({ uuid }) => uuid);

      await removeList(removedIds);

      return;
    }

    const res = await deleteEventsAll();

    if (res) {
      eventsStore.removeAll();
    }
  };

  const removeById = async (eventId: EventId) => {
    await removeList([eventId]);
  };

  const removeByType = async (eventType: EventType) => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({ type, uuid }) => type === eventType && !lockedIds.value.includes(uuid))
        .map(({ uuid }) => uuid);

      await removeList(removedIds);

      return;
    }

    const res = await deleteEventsByType(eventType);

    if (res) {
      eventsStore.removeByType(eventType);
    }
  };

  const getAll = () => {
    getEventsAll()
      .then((eventsList: ServerEvent<unknown>[]) => {
        if (eventsList.length) {
          eventsStore.initializeEvents(eventsList);
        } else {
          // NOTE: clear cached events hardly
          eventsStore.removeAll();
        }
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return {
    items: events as unknown as Ref<ServerEvent<unknown>[]>,
    getItem: getEvent,
    getAll,
    removeAll,
    removeByType,
    removeById,
  };
};
