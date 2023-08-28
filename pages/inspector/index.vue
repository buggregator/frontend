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
        events: $events.itemsGroupByType[EVENT_TYPES.INSPECTOR],
        title: "Inspector",
        eventsType: EVENT_TYPES.INSPECTOR,
        savedEventsByType: $cachedEvents.savedEventsByType,
        clearEvents: () => $events.removeByType(EVENT_TYPES.INSPECTOR),
        toggleUpdate: () => {
          if (
            $cachedEvents.savedEventsByType.value[EVENT_TYPES.INSPECTOR]
              .length > 0
          ) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.INSPECTOR);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.INSPECTOR);
          }
        },
      };
    }

    return {
      events: [],
      title: "Inspector",
      eventsType: EVENT_TYPES.INSPECTOR,
      savedEventsByType: {},
      toggleUpdate: () => {},
      clearEvents: () => {},
    };
  },
  head() {
    return {
      title: `Inspector [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
