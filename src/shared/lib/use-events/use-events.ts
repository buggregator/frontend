import { storeToRefs } from "pinia";
import type { Ref } from "vue";
import type { RayContentLock } from "~/src/entities/ray/types";
import {
  type TEventsCachedIdsMap,
  useEventsStore,
} from "../../stores";
import type {ServerEvent, NormalizedEvent, EventId, EventType, TEventsGroup} from '../../types';
import { useApiTransport } from "../use-api-transport";
import { normalizeUnknownEvent } from "./normalize-unknown-event";
import { type TUseEventsApi, useEventsApi } from "./use-events-api";


type TUseEvents = () => {
  normalizeUnknownEvent: (event: ServerEvent<unknown>) => NormalizedEvent<unknown>
  events: TUseEventsApi
  getItemsCount: Ref<(type?: EventType) => number>
  cachedEvents: {
    idsByType: Ref<TEventsCachedIdsMap>;
    stopUpdatesByType: (type: TEventsGroup) => void
    runUpdatesByType: (type: TEventsGroup) => void
  },
  lockedIds: {
    items: Ref<EventId[]>
    add: (id: EventId) => void
    remove: (id: EventId) => void
  },
  rayExecution: {
    continue: (contentName: RayContentLock["name"]) => void
    stop: (contentName: RayContentLock["name"]) => void
  }
}

export const useEvents: TUseEvents = () => {
  const eventsStore = useEventsStore();

  const {
    eventsCounts,
    cachedIds,
    lockedIds,
  } = storeToRefs(eventsStore)

  const {
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  return {
    normalizeUnknownEvent,
    events: useEventsApi(),
    getItemsCount: eventsCounts,
    cachedEvents: {
      idsByType: cachedIds as Ref<TEventsCachedIdsMap>,
      stopUpdatesByType: eventsStore.addCachedByType,
      runUpdatesByType: eventsStore.removeCachedByType,
    },
    lockedIds: {
      items: lockedIds as unknown as Ref<EventId[]>,
      add: eventsStore.addLockedIds,
      remove: eventsStore.removeLockedIds,
    },
    rayExecution: {
      continue: rayContinueExecution,
      stop: rayStopExecution,
    }
  }
}
