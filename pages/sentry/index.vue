<script lang="ts">
import { defineComponent } from "vue";
import PageIndex from "~/pages/index.vue";
import { EVENT_TYPES } from "~/config/constants";
import { useNuxtApp } from "#app";

export default defineComponent({
  extends: PageIndex,
  setup() {
    if (process.client) {
      const { $events } = useNuxtApp();

      if (!$events?.items?.value.length) {
        $events.getAll();
      }
      const isStopUpdate =
        $events.cachedItemsGroupByType[EVENT_TYPES.SENTRY].value.length;

      const visibleEvents = isStopUpdate
        ? $events.cachedItemsGroupByType[EVENT_TYPES.SENTRY]
        : $events.itemsGroupByType[EVENT_TYPES.SENTRY];

      return {
        events: visibleEvents,
        title: "Sentry",
        isStopUpdate,
        stopUpdate: () => $events.stopUpdatesByType(EVENT_TYPES.SENTRY),
        clearEvents: () => $events.removeByType(EVENT_TYPES.SENTRY),
      };
    }

    return {
      events: [],
      title: "Sentry",
      isStopUpdate: false,
      stopUpdate: () => {},
      clearEvents: () => {},
    };
  },
  head() {
    return {
      title: `Sentry [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
