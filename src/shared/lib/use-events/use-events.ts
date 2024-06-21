import { storeToRefs } from "pinia";
import type { Ref } from "vue";
import type { RayContentLock } from "~/src/entities/ray/types";
import {
  type TCachedEventsEmptyMap,
  type TEventsGroup,
  useCachedIdsStore,
  useEventStore,
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
    idsByType: Ref<TCachedEventsEmptyMap>;
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
  const cachedIdsStore = useCachedIdsStore();
  const lockedIdsStore = useLockedIdsStore();
  const eventsStore = useEventStore();

  const {
    getCounts
  } = storeToRefs(eventsStore)

  const {
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  const {
    cachedIds,
  } = storeToRefs(cachedIdsStore)

  const {
    lockedIds,
  } = storeToRefs(lockedIdsStore)

  return {
    normalizeUnknownEvent,
    events: useEventsApi(),
    getItemsCount: getCounts,
    cachedEvents: {
      idsByType: cachedIds as unknown as Ref<TCachedEventsEmptyMap>,
      stopUpdatesByType: cachedIdsStore.setByType,
      runUpdatesByType: cachedIdsStore.removeByType,
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
