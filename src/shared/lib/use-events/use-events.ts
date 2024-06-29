import { storeToRefs } from "pinia";
import type { Ref } from "vue";
import type { RayContentLock } from "~/src/entities/ray/types";
import {
  type TEventsCachedIdsMap,
  type TEventsGroup,
  useEventsStore,
  useLockedIdsStore
} from "../../stores";
import type {ServerEvent, NormalizedEvent, EventId, EventType} from '../../types';
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
  const lockedIdsStore = useLockedIdsStore();
  const eventsStore = useEventsStore();

  const {
    eventsCounts,
    cachedIds
  } = storeToRefs(eventsStore)

  const {
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  const {
    lockedIds,
  } = storeToRefs(lockedIdsStore)

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
      add: lockedIdsStore.add,
      remove: lockedIdsStore.remove,
    },
    rayExecution: {
      continue: rayContinueExecution,
      stop: rayStopExecution,
    }
  }
}
