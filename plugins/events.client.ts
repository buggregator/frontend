import {apiTransport} from '~/utils/events-transport'
import {useEventStore} from "~/stores/events";
import {EventId, OneOfValues, ServerEvent} from "~/config/types";
import {EVENT_TYPES} from "~/config/constants";
import {storeToRefs} from "pinia";

export default defineNuxtPlugin(() => {
  const eventsStore = useEventStore();

  const {
    deleteEvent,
    deleteEventsAll,
    deleteEventsByType,
    getEventsAll,
    makeEventUrl,
  } = apiTransport({
    onEventReceiveCb: (event: ServerEvent<unknown>) => {
      eventsStore.addEvents([event]);
    }
  });

  const removeAll = () => {
    deleteEventsAll();
    eventsStore.removeEvents()
  }

  const removeById = (eventId: EventId) => {
    deleteEvent(eventId);
    eventsStore.removeEventById(eventId);
  }

  const removeByType = (type: OneOfValues<typeof EVENT_TYPES>) => {
    deleteEventsByType(type);
    eventsStore.removeEventsByType(type);
  }

  const getAll = () => {
    getEventsAll.then((events: ServerEvent<unknown>[]) => {
      if (events.length) {
        eventsStore.addEvents(events);
      } else {
        // NOTE: clear cached events hardly
        eventsStore.removeEvents();
      }
    }).catch((err) => {
      console.error('getAll err', err);
    })
  }

  const {
    events,
    cachedEventsIdsMap,
  } = storeToRefs(eventsStore)

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
        eventsIdsByType: cachedEventsIdsMap,
        stopUpdatesByType: eventsStore.setCachedEvents,
        runUpdatesByType: eventsStore.removeCachedEvents,
      }
    }
  }
})
