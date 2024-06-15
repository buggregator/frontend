import { defineStore } from "pinia";
import {AVAILABLE_EVENTS_TYPES_LIST} from "../constants";
import { type EventId, type EventType, type ServerEvent} from '../types';
import { useLockedIdsStore } from "./locked-ids";

const MAX_EVENTS_COUNT = import.meta.env.FE_MAX_EVENTS_COUNT || Infinity;

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
  }),
  actions: {
    initialize(events: ServerEvent<unknown>[]): void {
      this.events =
        events
          .filter((event) => AVAILABLE_EVENTS_TYPES_LIST.includes(event.type as EventType))
          .slice(0, MAX_EVENTS_COUNT);
    },
    addList(events: ServerEvent<unknown>[]): void {
      events
        .filter((event) => AVAILABLE_EVENTS_TYPES_LIST.includes(event.type as EventType))
        .forEach((event) => {
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
