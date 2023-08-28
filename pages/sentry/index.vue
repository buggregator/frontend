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
        events: $events.itemsGroupByType[EVENT_TYPES.SENTRY],
        title: "Sentry",
        eventsType: EVENT_TYPES.SENTRY,
        savedEventsByType: $cachedEvents.savedEventsByType,
        clearEvents: () => $events.removeByType(EVENT_TYPES.SENTRY),
        toggleUpdate: () => {
          if (
            $cachedEvents.savedEventsByType.value[EVENT_TYPES.SENTRY].length > 0
          ) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.SENTRY);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.SENTRY);
          }
        },
      };
    }

    return {
      events: [],
      title: "Sentry",
      eventsType: EVENT_TYPES.SENTRY,
      savedEventsByType: {},
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
