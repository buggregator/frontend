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
        $cachedEvents.itemsGroupByType[EVENT_TYPES.HTTP_DUMP].value.length;

      const visibleEvents = isStopUpdate
        ? $cachedEvents.itemsGroupByType[EVENT_TYPES.HTTP_DUMP]
        : $events.itemsGroupByType[EVENT_TYPES.HTTP_DUMP];

      return {
        events: visibleEvents,
        title: "Http dumps",
        isStopUpdate,
        toggleUpdate: () => {
          if (isStopUpdate) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.HTTP_DUMP);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.HTTP_DUMP);
          }
        },
        clearEvents: () => $events.removeByType(EVENT_TYPES.HTTP_DUMP),
      };
    }

    return {
      events: [],
      title: "Http dumps",
      isStopUpdate: false,
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
