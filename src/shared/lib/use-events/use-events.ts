import { storeToRefs } from "pinia";
import type { Ref } from "vue";
import type { RayContentLock } from "@/entities/ray/types";
import {
  type TEventsCachedIdsMap,
  useEventsStore,
} from "../../stores";
import type {ServerEvent, NormalizedEvent, EventId, EventType, PageEventTypes} from '../../types';
import { isRequestOk } from "../io/request-result";
import { useApiTransport } from "../use-api-transport";
import { showToast } from "../use-keyboard-nav";
import { normalizeUnknownEvent } from "./normalize-unknown-event";
import { type TUseEventsApi, useEventsApi } from "./use-events-api";


type TUseEvents = () => {
  normalizeUnknownEvent: (event: ServerEvent<unknown>) => NormalizedEvent<unknown>
  events: TUseEventsApi
  getItemsCount: Ref<(type?: EventType) => number>
  cachedEvents: {
    idsByType: Ref<TEventsCachedIdsMap>;
    stopUpdatesByType: (type: PageEventTypes) => void
    runUpdatesByType: (type: PageEventTypes) => void
  },
  lockedIds: {
    items: Ref<EventId[]>
    add: (id: EventId) => Promise<boolean>
    remove: (id: EventId) => Promise<boolean>
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
    pinEvent,
    unpinEvent,
  } = useApiTransport();

  // The pin shows at once and is taken back when the server refuses it.
  const sendPin = async (request: () => Promise<unknown>, failure: string) => {
    let result: unknown

    try {
      result = await request()
    } catch (e) {
      console.error(e)
    }

    const ok = isRequestOk(result)

    if (!ok) {
      showToast(failure, 4000)
    }

    return ok
  }

  const addPin = async (id: EventId) => {
    eventsStore.addLockedIds(id)

    const ok = await sendPin(() => pinEvent(id), 'Could not pin the event')

    if (!ok) {
      eventsStore.removeLockedIds(id)
    }

    return ok
  }

  const removePin = async (id: EventId) => {
    eventsStore.removeLockedIds(id)

    const ok = await sendPin(() => unpinEvent(id), 'Could not unpin the event')

    if (!ok) {
      eventsStore.addLockedIds(id)
    }

    return ok
  }

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
      add: addPin,
      remove: removePin,
    },
    rayExecution: {
      continue: rayContinueExecution,
      stop: rayStopExecution,
    }
  }
}
