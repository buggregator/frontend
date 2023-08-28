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
        events: $events.itemsGroupByType[EVENT_TYPES.HTTP_DUMP],
        title: "Http dumps",
        eventsType: EVENT_TYPES.HTTP_DUMP,
        savedEventsByType: $cachedEvents.savedEventsByType,
        clearEvents: () => $events.removeByType(EVENT_TYPES.HTTP_DUMP),
        toggleUpdate: () => {
          if (
            $cachedEvents.savedEventsByType.value[EVENT_TYPES.HTTP_DUMP]
              .length > 0
          ) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.HTTP_DUMP);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.HTTP_DUMP);
          }
        },
      };
    }

    return {
      events: [],
      title: "Http dumps",
      eventsType: EVENT_TYPES.HTTP_DUMP,
      savedEventsByType: {},
      toggleUpdate: () => {},
      clearEvents: () => {},
    };
  },
  head() {
    return {
      title: `Http dumps [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
