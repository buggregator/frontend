import { defineStore } from "pinia";
import { EventId, ServerEvent, TEventType } from "~/config/types";



export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
  }),
  actions: {
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
      this.events.length = 0;
    },
    removeById(eventUuid: EventId) {
      this.events = this.events.filter(({ uuid }) => uuid !== eventUuid);
    },
    removeByType(eventType: TEventType) {
      this.events = this.events.filter(({ type }) => type !== eventType);
    },

  },
});
