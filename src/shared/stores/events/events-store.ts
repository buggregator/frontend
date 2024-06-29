import { defineStore } from "pinia";
import {PAGE_TYPES} from "../../constants";
import type { EventId, EventType , ServerEvent, TEventsGroup} from '../../types';
import {EVENT_TYPES, LOCAL_STORAGE_KEYS} from "../../types";
import { useLockedIdsStore } from "../locked-ids";
import type {TEventsCachedIdsMap} from "./types";

const MAX_EVENTS_COUNT = 500;

const initialCachedIds: TEventsCachedIdsMap = {
  [PAGE_TYPES.SENTRY]: [] as EventId[],
  [PAGE_TYPES.INSPECTOR]: [] as EventId[],
  [PAGE_TYPES.PROFILER]: [] as EventId[],
  [PAGE_TYPES.SMTP]: [] as EventId[],
  [PAGE_TYPES.RAY_DUMP]: [] as EventId[],
  [PAGE_TYPES.VAR_DUMP]: [] as EventId[],
  [PAGE_TYPES.HTTP_DUMP]: [] as EventId[],
  [PAGE_TYPES.MONOLOG]: [] as EventId[],
  [PAGE_TYPES.ALL_EVENTS]: [] as EventId[],
};

const { localStorage } = window;
const getCachedIds = (): TEventsCachedIdsMap => {
  const storageValue = localStorage?.getItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS);

  if (storageValue) {
    return JSON.parse(storageValue) as TEventsCachedIdsMap;
  }

  return initialCachedIds;
};

const syncLocalStorage = (cachedEventMap: TEventsCachedIdsMap) => {
  localStorage?.setItem(LOCAL_STORAGE_KEYS.CACHED_EVENTS, JSON.stringify(cachedEventMap));
}

export const useEventStore = defineStore("useEventStore", {
  state: () => ({
    events: [] as ServerEvent<unknown>[],
    cachedIds: getCachedIds(),
  }),
  getters: {
    eventsCounts: ({events}) => (eventType: EVENT_TYPES | undefined): number => {
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
    },
    cachedTypesList(state) {
      return Object.entries(state.cachedIds).filter(([_, value]) => value.length > 0).map(([key]) => key as TEventsGroup)
    }
  },
  actions: {
    // events
    initialize(events: ServerEvent<unknown>[]): void {
      this.events = events.slice(0, MAX_EVENTS_COUNT);

      this.syncCachedWithActive(events.map(({ uuid }) => uuid));
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

      this.removeCachedAll();
    },
    removeByIds(eventUuids: EventId[]) {
      const { lockedIds } = useLockedIdsStore();

      if (lockedIds.length) {
        this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid) || lockedIds.includes(uuid));

        return
      }

      this.events = this.events.filter(({ uuid }) => !eventUuids.includes(uuid));

      this.removeCachedByIds(eventUuids);
    },
    removeById(eventUuid: EventId) {
      this.removeByIds([eventUuid]);

      this.removeCachedById(eventUuid);
    },
    removeByType(eventType: EventType) {
      const { lockedIds } = useLockedIdsStore();

      if (lockedIds.length) {
        this.events = this.events.filter(({ type, uuid }) => type !== eventType || lockedIds.includes(uuid));

        return
      }

      this.events = this.events.filter(({ type }) => type !== eventType);
    },
    // cached ids
    addCachedByType(cachedType: TEventsGroup) {
      this.events
        .filter(({ type }) =>
          type === cachedType || cachedType === PAGE_TYPES.ALL_EVENTS
        )
        .forEach((event) => {
          this.cachedIds[cachedType].push(event.uuid);
        });

      syncLocalStorage(this.cachedIds);
    },
    removeCachedByType(type: TEventsGroup) {
      this.cachedIds[type].length = 0;
      syncLocalStorage(this.cachedIds);
    },
    removeCachedByIds(uuids: EventId[]) {
      this.cachedTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => uuids.includes(uuid)
        );
      });

      syncLocalStorage(this.cachedIds);
    },
    removeCachedById(eventUuid: EventId) {
      this.removeCachedByIds([eventUuid]);
    },
    removeCachedAll() {
      this.cachedIds = initialCachedIds;
      syncLocalStorage(this.cachedIds);
    },
    syncCachedWithActive(activeIds: EventId[]) {
      if (!activeIds.length) {
        this.removeCachedAll();

        return;
      }

      this.cachedTypesList.forEach((type) => {
        this.cachedIds[type] = this.cachedIds[type].filter(
          (uuid: EventId) => activeIds.includes(uuid)
        );
      });

      syncLocalStorage(this.cachedIds);
    }
  },
});
