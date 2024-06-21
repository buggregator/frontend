import { defineStore } from "pinia";
import type { EventId, EventType, ServerEvent } from '../types';
import {EVENT_TYPES} from "../types";
import { useLockedIdsStore } from "./locked-ids";

const MAX_EVENTS_COUNT = 500;

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
  }),
  getters: {
    getCounts: ({events}) => (eventType: EVENT_TYPES | undefined): number => {
      const counts = {
        [EVENT_TYPES.VAR_DUMP]: events.filter(({type}) => type === EVENT_TYPES.VAR_DUMP).length,
        [EVENT_TYPES.SMTP]: events.filter(({type}) => type === EVENT_TYPES.SMTP).length,
        [EVENT_TYPES.SENTRY]: events.filter(({type}) => type === EVENT_TYPES.SENTRY).length,
        [EVENT_TYPES.PROFILER]: events.filter(({type}) => type === EVENT_TYPES.PROFILER).length,
        [EVENT_TYPES.MONOLOG]: events.filter(({type}) => type === EVENT_TYPES.MONOLOG).length,
        [EVENT_TYPES.INSPECTOR]: events.filter(({type}) => type === EVENT_TYPES.INSPECTOR).length,
        [EVENT_TYPES.HTTP_DUMP]: events.filter(({type}) => type === EVENT_TYPES.HTTP_DUMP).length,
        [EVENT_TYPES.RAY_DUMP]: events.filter(({type}) => type === EVENT_TYPES.RAY_DUMP).length
      }

      return eventType && counts[eventType] != null ? counts[eventType] : events.length;
    }

  },
  actions: {
    initialize(events: ServerEvent<unknown>[]): void {
      this.events = events.slice(0, MAX_EVENTS_COUNT);
    },
    addList(events: ServerEvent<unknown>[]): void {
      events.forEach((event) => {
        const isExistedEvent: boolean = this.events.some((el): boolean => el.uuid === event.uuid);
        if (!isExistedEvent) {
          this.events.unshift(event)

          if (this.events.length > MAX_EVENTS_COUNT) {
            this.events.pop()
          }
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
    removeAll() {
      const { lockedIds } = useLockedIdsStore();

      if (lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => lockedIds.includes(uuid));

        return
      }

      this.events.length = 0;
    },
    removeByIds(eventUuids: EventId[]) {
      const { lockedIds } = useLockedIdsStore();

      if (lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid) || lockedIds.includes(uuid));

        return
      }

      this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid));
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);
    },
    removeByType(eventType: EventType) {
      const { lockedIds } = useLockedIdsStore();

      if (lockedIds.length) {
        this.events = this.events.filter(({ type, uuid }) => type !== eventType || lockedIds.includes(uuid));

        return
      }

      this.events = this.events.filter(({ type }) => type !== eventType);
    },
  },
});
