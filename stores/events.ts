import { defineStore } from "pinia";
import {
  EventId,
  HttpDump,
  Inspector,
  OneOfValues,
  Profiler,
  RayDump,
  Sentry,
  ServerEvent,
  SMTP,
  VarDump,
} from "~/config/types";
import { ALL_EVENTS, EVENT_TYPES } from "~/config/constants";

type TCachedEventsEmptyMap = Record<OneOfValues<typeof EVENT_TYPES>, EventId[]>;

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
  const storageValue = localStorage?.getItem("cached_events");

  if (storageValue) {
    return JSON.parse(storageValue) as TCachedEventsEmptyMap;
  }

  return initialCachedEventsIdsMap;
};

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedEventsIdsMap: getCachedEventsIdsMap(),
  }),
  actions: {
    addEvents(events: ServerEvent<unknown>[]) {
      events.forEach((event) => {
        const isExistedEvent = this.events.some((el) => el.uuid === event.uuid);
        if (!isExistedEvent) {
          this.events.unshift(event);
        } else {
          this.events = this.events.map((el) => {
            if (el.uuid === event.uuid) {
              return event;
            }
            return el;
          });
        }
      });
    },
    removeEvents() {
      this.events.length = 0;

      this.cachedEventsIdsMap = initialCachedEventsIdsMap;
    },
    removeEventById(eventUuid: EventId) {
      const eventType = this.events.find(
        ({ uuid }) => uuid === eventUuid
      )?.type;

      if (eventType) {
        this.cachedEventsIdsMap[eventType] = this.cachedEventsIdsMap[
          eventType
        ].filter((uuid: EventId) => uuid !== eventUuid);
      }

      if (this.cachedEventsIdsMap[ALL_EVENTS].length) {
        this.cachedEventsIdsMap[ALL_EVENTS] = this.cachedEventsIdsMap[
          ALL_EVENTS
        ].filter((uuid: EventId) => uuid !== eventUuid);
      }

      this.events = this.events.filter(({ uuid }) => uuid !== eventUuid);
    },
    removeEventsByType(eventType: OneOfValues<typeof EVENT_TYPES>) {
      this.cachedEventsIdsMap[eventType].length = 0;
      this.events = this.events.filter(({ type }) => type !== eventType);
    },

    setCachedEvents(
      eventType: OneOfValues<typeof EVENT_TYPES | typeof ALL_EVENTS>
    ) {
      this.events
        .filter(({ type }) =>
          eventType === ALL_EVENTS ? true : type === eventType
        )
        .forEach((event) => {
          this.cachedEventsIdsMap[eventType].push(event.uuid);
        });

      localStorage?.setItem(
        "cached_events",
        JSON.stringify(this.cachedEventsIdsMap)
      );
    },
    removeCachedEvents(
      eventType: OneOfValues<typeof EVENT_TYPES | typeof ALL_EVENTS>
    ) {
      this.cachedEventsIdsMap[eventType].length = 0;

      localStorage?.setItem(
        "cached_events",
        JSON.stringify(this.cachedEventsIdsMap)
      );
    },
  },
});
