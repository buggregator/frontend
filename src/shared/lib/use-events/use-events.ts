import { storeToRefs } from "pinia";
import type { Ref } from "vue";
import type { ServerEvent, NormalizedEvent } from '../../types';
import { normalizeUnknownEvent } from "./normalize-unknown-event";
import { useEventsPlugin, type TUseEventsPluginData } from "./use-events-plugin";
import type { TCachedEventsEmptyMap, TEventsGroup } from "~/stores/cached-ids";
import { useCachedIdsStore } from "~/stores/cached-ids";

type TUseEvents = () => {
  normalizeUnknownEvent: (event: ServerEvent<unknown>) => NormalizedEvent<unknown>
  events: TUseEventsPluginData
  cachedEvents: {
    idsByType: Ref<TCachedEventsEmptyMap>;
    stopUpdatesByType: (type: TEventsGroup) => void
    runUpdatesByType: (type: TEventsGroup) => void
  }
}

export const useEvents: TUseEvents = () => {
  const cachedIdsStore = useCachedIdsStore();

  const {
    cachedIds,
  } = storeToRefs(cachedIdsStore)

  return {
    normalizeUnknownEvent,
    events: useEventsPlugin(),
    cachedEvents: {
      idsByType: cachedIds as unknown as Ref<TCachedEventsEmptyMap>,
      stopUpdatesByType: cachedIdsStore.setByType,
      runUpdatesByType: cachedIdsStore.removeByType,
    },
  }
}
