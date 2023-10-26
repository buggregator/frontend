import { defineStore } from "pinia";
import { EventId, TEventGroup, TEventType } from "~/config/types";
import { ALL_EVENTS, EVENT_TYPES, LOCAL_STORAGE_KEYS } from "~/config/constants";
import { useEventStore } from "~/stores/events";


type TCachedEventsEmptyMap = Record<TEventType, EventId[]>;

const initialcachedIds: TCachedEventsEmptyMap = {
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
const getCachedIds = (): TCachedEventsEmptyMap => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TCachedEventsEmptyMap;
  }

  return initialcachedIds;
};

const syncLocalStorage = (cachedEventMap: TCachedEventsEmptyMap) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS, JSON.stringify(cachedEventMap));
}

export const useCachedIdsStore = defineStore("useCachedIdsStore", {
  state: () => ({
    cachedIds: getCachedIds(),
  }),
  getters: {
    cachedTypesList(state) {
      return Object.entries(state.cachedIds).filter(([_, value]) => value.length > 0).map(([key]) => key)
    }
  },
  actions: {
    setByType(cachedType: TEventGroup) {
      const { events } =  useEventStore();

      events
        .filter(({ type }) =>
          type === cachedType || cachedType === ALL_EVENTS
        )
        .forEach((event) => {
          this.cachedIds[cachedType].push(event.uuid);
        });

      syncLocalStorage(this.cachedIds);
    },
    removeByType(type: TEventGroup) {
      this.cachedIds[type].length = 0;
      syncLocalStorage(this.cachedIds);
    },
    removeById(eventUuid: EventId) {
      this.cachedTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => uuid !== eventUuid
        );
      });

      syncLocalStorage(this.cachedIds);
    },
    removeAll() {
      this.cachedIds = initialcachedIds;
      syncLocalStorage(this.cachedIds);
    },
    syncWithActive(activeIds: EventId[]) {
      if (!activeIds.length) {
        this.removeAll();

        return;
      }

      this.cachedTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => activeIds.includes(uuid)
        );
      });

      syncLocalStorage(this.cachedIds);
    }
  }
})
