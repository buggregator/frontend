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
        $cachedEvents.itemsGroupByType[EVENT_TYPES.SENTRY].value.length;

      const visibleEvents = isStopUpdate
        ? $cachedEvents.itemsGroupByType[EVENT_TYPES.SENTRY]
        : $events.itemsGroupByType[EVENT_TYPES.SENTRY];

      return {
        events: visibleEvents,
        title: "Sentry",
        isStopUpdate,
        toggleUpdate: () => {
          if (isStopUpdate) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.SENTRY);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.SENTRY);
          }
        },
        clearEvents: () => $events.removeByType(EVENT_TYPES.SENTRY),
      };
    }

    return {
      events: [],
      title: "Sentry",
      isStopUpdate: false,
      toggleUpdate: () => {},
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
