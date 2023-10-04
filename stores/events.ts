import { defineStore } from "pinia";
import {
  EventId,
  OneOfValues,
  ServerEvent,
} from "~/config/types";
import { ALL_EVENTS, EVENT_TYPES, LOCAL_STORAGE_KEYS } from "~/config/constants";

type TCachedEventsEmptyMap = Record<OneOfValues<typeof EVENT_TYPES>, EventId[]>;
type TCachedEventsType = OneOfValues<typeof EVENT_TYPES | typeof ALL_EVENTS>;

const initialCachedEventsIdsMap: TCachedEventsEmptyMap = {
  [EVENT_TYPES.SENTRY]: [] as EventId[],
  [EVENT_TYPES.INSPECTOR]: [] as EventId[],
  [EVENT_TYPES.PROFILER]: [] as EventId[],
  [EVENT_TYPES.SMTP]: [] as EventId[],
  [EVENT_TYPES.RAY_DUMP]: [] as EventId[],
  [EVENT_TYPES.VAR_DUMP]: [] as EventId[],
  [EVENT_TYPES.HTTP_DUMP]: [] as EventId[],
  [ALL_EVENTS]: [] as EventId[],
};

const { localStorage } = window;
const getCachedEventsIdsMap = (): TCachedEventsEmptyMap => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TCachedEventsEmptyMap;
  }

  return initialCachedEventsIdsMap;
};

const updateCachedEventsLocalStorage = (cachedEventMap: TCachedEventsEmptyMap) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS, JSON.stringify(cachedEventMap));
}

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedEventsIdsMap: getCachedEventsIdsMap(), // TODO: need to split to separate store
  }),
  actions: {
    addEvents(events: ServerEvent<unknown>[]) {
      events.forEach((event) => {
        const isExistedEvent = this.events.some((el) => el.uuid === event.uuid);
        if (!isExistedEvent) {
          this.events.unshift(event);
        } else {
          this.events = this.events.map((el) => {
            if (el.uuid !== event.uuid) {
              return el; // add new
            }

            return event; // replace existed
          });
        }
      });
    },
    removeEvents() {
      this.events.length = 0;

      this.clearCachedEvents();
    },
    removeEventById(eventUuid: EventId) {
      const eventType = this.events.find(
        ({ uuid }) => uuid === eventUuid
      )?.type;

      if (eventType && this.cachedEventsIdsMap[eventType]?.length) {
        this.cachedEventsIdsMap[eventType] = this.cachedEventsIdsMap[
          eventType
        ].filter((uuid: EventId) => uuid !== eventUuid);
      }

      if (this.cachedEventsIdsMap[ALL_EVENTS].length) {
        this.cachedEventsIdsMap[ALL_EVENTS] = this.cachedEventsIdsMap[
          ALL_EVENTS
        ].filter((uuid: EventId) => uuid !== eventUuid);
      }

      updateCachedEventsLocalStorage(this.cachedEventsIdsMap);

      this.events = this.events.filter(({ uuid }) => uuid !== eventUuid);
    },
    removeEventsByType(eventType: OneOfValues<typeof EVENT_TYPES>) {
      this.events = this.events.filter(({ type }) => type !== eventType);

      this.removeCachedEventsByType(eventType as TCachedEventsType);
    },

    setCachedEventsByType(
      cachedType: TCachedEventsType
    ) {
      this.events
        .filter(({ type }) =>
          cachedType === ALL_EVENTS ? true : type === cachedType
        )
        .forEach((event) => {
          this.cachedEventsIdsMap[cachedType].push(event.uuid);
        });

      updateCachedEventsLocalStorage(this.cachedEventsIdsMap);
    },
    removeCachedEventsByType(cachedType: TCachedEventsType) {
      this.cachedEventsIdsMap[cachedType].length = 0;
      updateCachedEventsLocalStorage(this.cachedEventsIdsMap);
    },
    clearCachedEvents() {
      this.cachedEventsIdsMap = initialCachedEventsIdsMap;
      updateCachedEventsLocalStorage(this.cachedEventsIdsMap);
    },
    sanitizeCachedEvents(events: ServerEvent<unknown>[]) {
      if (!events.length) {
        this.clearCachedEvents();

        return;
      }

      const cachedEventsKeys = Object.entries(this.cachedEventsIdsMap).filter(([_, value]) => value.length > 0).map(([key]) => key);
      const eventsIds = events.map(({ uuid }) => uuid);

      cachedEventsKeys.forEach((key) => {
        const type = key as TCachedEventsType

        this.cachedEventsIdsMap[type] = this.cachedEventsIdsMap[type].filter(
          (uuid: EventId) => eventsIds.includes(uuid)
        );
      });

      updateCachedEventsLocalStorage(this.cachedEventsIdsMap);
    }
  },
});
