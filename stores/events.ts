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

type TCachedEventsEmptyMap = Record<
  OneOfValues<typeof EVENT_TYPES>,
  ServerEvent<unknown>[]
>;

const initialCachedEventsMap: TCachedEventsEmptyMap = {
  [EVENT_TYPES.SENTRY]: [] as ServerEvent<Sentry>[],
  [EVENT_TYPES.INSPECTOR]: [] as ServerEvent<Inspector>[],
  [EVENT_TYPES.PROFILER]: [] as ServerEvent<Profiler>[],
  [EVENT_TYPES.SMTP]: [] as ServerEvent<SMTP>[],
  [EVENT_TYPES.RAY_DUMP]: [] as ServerEvent<RayDump>[],
  [EVENT_TYPES.VAR_DUMP]: [] as ServerEvent<VarDump>[],
  [EVENT_TYPES.HTTP_DUMP]: [] as ServerEvent<HttpDump>[],
  [ALL_EVENTS]: [] as ServerEvent<unknown>[],
};

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedEventsMap: initialCachedEventsMap,
  }),
  actions: {
    removeEventById(eventUuid: EventId) {
      const eventType = this.events.find(
        ({ uuid }) => uuid === eventUuid
      )?.type;

      if (eventType) {
        this.cachedEventsMap[eventType] = this.cachedEventsMap[
          eventType
        ].filter(({ uuid }) => uuid !== eventUuid);
      }

      if (this.cachedEventsMap[ALL_EVENTS].length) {
        this.cachedEventsMap[ALL_EVENTS] = this.cachedEventsMap[
          ALL_EVENTS
        ].filter(({ uuid }) => uuid !== eventUuid);
      }

      this.events = this.events.filter(({ uuid }) => uuid !== eventUuid);
    },
    removeEvents() {
      this.events.length = 0;

      this.cachedEventsMap = initialCachedEventsMap;
    },
    removeEventsByType(eventType: OneOfValues<typeof EVENT_TYPES>) {
      this.cachedEventsMap[eventType].length = 0;
      this.events = this.events.filter(({ type }) => type !== eventType);
    },
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
    setCachedEvents(eventType: OneOfValues<typeof EVENT_TYPES | typeof ALL_EVENTS>) {
      this.events
        .filter(({ type }) =>
          eventType === ALL_EVENTS ? true : type === eventType
        )
        .forEach((event) => {
          this.cachedEventsMap[eventType].push(event);
        });
    },
    removeCachedEvents(eventType: OneOfValues<typeof EVENT_TYPES | typeof ALL_EVENTS>) {
      this.cachedEventsMap[eventType].length = 0;
    },
  },
});
