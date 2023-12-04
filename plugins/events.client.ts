import { storeToRefs } from "pinia";
import { useApiTransport } from '~/src/shared/lib/use-api-transport'
import type { EventId, EventType, ServerEvent } from '~/src/shared/types';
import { useCachedIdsStore } from "~/stores/cached-ids";
import { useEventStore } from "~/stores/events";
import { useLockedIdsStore } from "~/stores/locked-ids";

export default defineNuxtPlugin(() => {
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
    deleteEvent,
    deleteEventsAll,
    deleteEventsList,
    deleteEventsByType,
    getEventsAll,
    getEvent,
    getUrl,
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  const removeList = async (uuids: EventId[]) => {
    if (uuids.length === 1) {
      const res = await deleteEvent(uuids[0])

      if (res) {
        eventsStore.removeById(uuids[0]);
        cachedIdsStore.removeById(uuids[0]);
      }

      return
    }

    const res = await deleteEventsList(uuids)

    if (res) {
      eventsStore.removeByIds(uuids);
      cachedIdsStore.removeByIds(uuids);
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
      cachedIdsStore.removeAll()
    }
  }

  const removeById = async (eventId: EventId) => {
    await removeList([eventId])
  }

  const removeByType = async (eventType: EventType) => {
    if (lockedIds.value.length) {
      const removedIds = events.value
        .filter(({ type, uuid }) => type !== eventType || lockedIds.value.includes(uuid))
        .map(({ uuid }) => uuid)

      await removeList(removedIds)

      return
    }

    const res = await deleteEventsByType(eventType)

    if (res) {
      eventsStore.removeByType(eventType);
      cachedIdsStore.removeByType(eventType);
    }
  }

  const getAll = () => {
    getEventsAll().then((eventsList: ServerEvent<unknown>[]) => {
      if (eventsList.length) {
        eventsStore.initialize(eventsList);
        cachedIdsStore.syncWithActive(eventsList.map(({ uuid }) => uuid));
      } else {
        // NOTE: clear cached events hardly
        eventsStore.removeAll();
        cachedIdsStore.removeAll();
      }
    }).catch((err) => {
      console.error('getAll err', err);
    })
  }

  const {
    cachedIds,
  } = storeToRefs(cachedIdsStore)

  return {
    provide: {
      events: {
        items: events,
        getItem: getEvent,
        getUrl,
        getAll,
        removeAll,
        removeByType,
        removeById,
      },
      cachedEvents: {
        eventsIdsByType: cachedIds,
        stopUpdatesByType: cachedIdsStore.setByType,
        runUpdatesByType: cachedIdsStore.removeByType,
      },
      rayExecution: {
        continue: rayContinueExecution,
        stop: rayStopExecution,
      },
      lockedIds: {
        items: lockedIds,
        add: lockedIdsStore.add,
        remove: lockedIdsStore.remove,
      }
    }
  }
})
