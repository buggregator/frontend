import {apiTransport} from '~/utils/events-transport'
import {useEventStore} from "~/stores/events";
import {useCachedIdsStore} from "~/stores/cached-ids";
import { EventId, ServerEvent, TEventGroup } from "~/config/types";
import {storeToRefs} from "pinia";

export default defineNuxtPlugin(() => {
  const eventsStore = useEventStore();
  const cachedIdsStore = useCachedIdsStore();

  const {
    deleteEvent,
    deleteEventsAll,
    deleteEventsByType,
    getEventsAll,
    makeEventUrl,
  } = apiTransport({
    onEventReceiveCb: (event: ServerEvent<unknown>) => {
      eventsStore.addList([event]);
    }
  });

  const removeAll = () => {
    deleteEventsAll();
    eventsStore.removeAll()
    cachedIdsStore.removeAll()
  }

  const removeById = (eventId: EventId) => {
    deleteEvent(eventId);
    eventsStore.removeById(eventId);
    cachedIdsStore.removeById(eventId);
  }

  const removeByType = (type: TEventGroup) => {
    deleteEventsByType(type);
    eventsStore.removeByType(type);
    cachedIdsStore.removeByType(type);
  }

  const getAll = () => {
    getEventsAll.then((events: ServerEvent<unknown>[]) => {
      if (events.length) {
        eventsStore.addList(events);
        cachedIdsStore.sanitizeWithEvents(events);
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
        buildItemFetchUrl: makeEventUrl,
        getAll,
        removeAll,
        removeByType,
        removeById,
      },
      cachedEvents: {
        eventsIdsByType: cachedIds,
        stopUpdatesByType: cachedIdsStore.setByType,
        runUpdatesByType: cachedIdsStore.removeByType,
      }
    }
  }
})
