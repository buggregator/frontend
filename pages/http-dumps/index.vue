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
        $events.cachedItemsGroupByType[EVENT_TYPES.HTTP_DUMP].value.length;

      const visibleEvents = isStopUpdate
        ? $events.cachedItemsGroupByType[EVENT_TYPES.HTTP_DUMP]
        : $events.itemsGroupByType[EVENT_TYPES.HTTP_DUMP];

      return {
        events: visibleEvents,
        title: "Http dumps",
        isStopUpdate,
        stopUpdate: () => $events.stopUpdatesByType(EVENT_TYPES.HTTP_DUMP),
        clearEvents: () => $events.removeByType(EVENT_TYPES.HTTP_DUMP),
      };
    }

    return {
      events: [],
      title: "Http dumps",
      isStopUpdate: false,
      stopUpdate: () => {},
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
