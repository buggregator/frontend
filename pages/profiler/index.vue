<script lang="ts">
import { defineComponent } from "vue";
import PageIndex from "~/pages/index.vue";
import { EVENT_TYPES } from "~/config/constants";
import { useNuxtApp } from "#app";

export default defineComponent({
  extends: PageIndex,
  setup() {
    if (process.client) {
      const { $events, $cachedEvents } = useNuxtApp();

      if (!$events?.items?.value.length) {
        $events.getAll();
      }
      return {
        events: $events.itemsGroupByType[EVENT_TYPES.PROFILER],
        title: "Profiler",
        eventsType: EVENT_TYPES.PROFILER,
        savedEventsByType: $cachedEvents.savedEventsByType,
        clearEvents: () => $events.removeByType(EVENT_TYPES.PROFILER),
        toggleUpdate: () => {
          if (
            $cachedEvents.savedEventsByType.value[EVENT_TYPES.PROFILER].length >
            0
          ) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.PROFILER);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.PROFILER);
          }
        },
      };
    }

    return {
      events: [],
      title: "Profiler",
      eventsType: EVENT_TYPES.PROFILER,
      savedEventsByType: {},
      toggleUpdate: () => {},
      clearEvents: () => {},
    };
  },
  head() {
    return {
      title: `Profiler [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
