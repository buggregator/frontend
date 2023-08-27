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
      const isStopUpdate =
        $cachedEvents.itemsGroupByType[EVENT_TYPES.PROFILER].value.length;

      const visibleEvents = isStopUpdate
        ? $cachedEvents.itemsGroupByType[EVENT_TYPES.PROFILER]
        : $events.itemsGroupByType[EVENT_TYPES.PROFILER];

      return {
        events: visibleEvents,
        title: "Profiler",
        isStopUpdate,
        stopUpdate: () => {
          $cachedEvents.stopUpdatesByType(EVENT_TYPES.PROFILER);
        },
        clearEvents: () => $events.removeByType(EVENT_TYPES.PROFILER),
      };
    }

    return {
      events: [],
      title: "Profiler",
      isStopUpdate: false,
      stopUpdate: () => {},
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
