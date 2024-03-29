import { defineStore } from "pinia";
import type { EventId, EventType, ServerEvent } from '~/src/shared/types';
import { useLockedIdsStore } from "~/stores/locked-ids";


export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
  }),
  actions: {
    initialize(events: ServerEvent<unknown>[]) {
      this.events = events;
    },
    addList(events: ServerEvent<unknown>[]) {
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
