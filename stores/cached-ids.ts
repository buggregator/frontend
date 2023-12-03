import { defineStore } from "pinia";
import { useEventStore } from "~/stores/events";
import { PAGE_TYPES } from "~/src/shared/constants";
import { EventId, LOCAL_STORAGE_KEYS, OneOfValues } from '~/src/shared/types';

type TEventsGroup = OneOfValues<typeof PAGE_TYPES>

type TCachedEventsEmptyMap = Record<TEventsGroup, EventId[]>;

const initialCachedIds: TCachedEventsEmptyMap = {
  [PAGE_TYPES.SENTRY]: [] as EventId[],
  [PAGE_TYPES.INSPECTOR]: [] as EventId[],
  [PAGE_TYPES.PROFILER]: [] as EventId[],
  [PAGE_TYPES.SMTP]: [] as EventId[],
  [PAGE_TYPES.RAY_DUMP]: [] as EventId[],
  [PAGE_TYPES.VAR_DUMP]: [] as EventId[],
  [PAGE_TYPES.HTTP_DUMP]: [] as EventId[],
  [PAGE_TYPES.ALL_EVENTS]: [] as EventId[],
};

const { localStorage } = window;
const getCachedIds = (): TCachedEventsEmptyMap => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TCachedEventsEmptyMap;
  }

  return initialCachedIds;
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
      return Object.entries(state.cachedIds).filter(([_, value]) => value.length > 0).map(([key]) => key as TEventsGroup)
    }
  },
  actions: {
    setByType(cachedType: TEventsGroup) {
      const { events } =  useEventStore();

      events
        .filter(({ type }) =>
          type === cachedType || cachedType === PAGE_TYPES.ALL_EVENTS
        )
        .forEach((event) => {
          this.cachedIds[cachedType].push(event.uuid);
        });

      syncLocalStorage(this.cachedIds);
    },
    removeByType(type: TEventsGroup) {
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
      this.cachedIds = initialCachedIds;
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
