import { storeToRefs } from "pinia";
import { useCachedIdsStore } from "~/stores/cached-ids";
import { useEventStore } from "~/stores/events";
import { useApiTransport } from '~/src/shared/lib/use-api-transport'
import { EventId, EventType, ServerEvent } from '~/src/shared/types';

export default defineNuxtPlugin(() => {
  const eventsStore = useEventStore();
  const cachedIdsStore = useCachedIdsStore();

  const {
    deleteEvent,
    deleteEventsAll,
    deleteEventsByType,
    getEventsAll,
    getEvent,
    getUrl,
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  const removeAll = async () => {
    const res = await deleteEventsAll()

    if (res) {
      eventsStore.removeAll()
      cachedIdsStore.removeAll()
    }
  }

  const removeById = async (eventId: EventId) => {
    const res = await deleteEvent(eventId)

    if (res) {
      eventsStore.removeById(eventId);
      cachedIdsStore.removeById(eventId);
    }
  }

  const removeByType = async (type: EventType) => {
    const res = await deleteEventsByType(type)

    if (res) {
      eventsStore.removeByType(type);
      cachedIdsStore.removeByType(type);
    }
  }

  const getAll = () => {
    getEventsAll().then((events: ServerEvent<unknown>[]) => {
      if (events.length) {
        eventsStore.addList(events);
        cachedIdsStore.syncWithActive(events.map(({ uuid }) => uuid));
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
    events,
  } = storeToRefs(eventsStore)

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
      }
    }
  }
})
