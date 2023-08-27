<script lang="ts">
import { defineComponent } from "vue";
import PageIndex from "~/pages/index.vue";
import { EVENT_TYPES } from "~/config/constants";
import { useNuxtApp, useRouter } from "#app";

export default defineComponent({
  extends: PageIndex,
  setup() {
    if (process.client) {
      const { $events, $cachedEvents } = useNuxtApp();

      if (!$events?.items?.value.length) {
        $events.getAll();
      }

      const isStopUpdate =
        $cachedEvents.itemsGroupByType[EVENT_TYPES.INSPECTOR].value.length;

      const visibleEvents = isStopUpdate
        ? $cachedEvents.itemsGroupByType[EVENT_TYPES.INSPECTOR]
        : $events.itemsGroupByType[EVENT_TYPES.INSPECTOR];

      return {
        events: visibleEvents,
        title: "Inspector",
        isStopUpdate,
        toggleUpdate: () => {
          if (isStopUpdate) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.INSPECTOR);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.INSPECTOR);
          }
        },
        clearEvents: () => $events.removeByType(EVENT_TYPES.INSPECTOR),
      };
    }

    return {
      events: [],
      title: "Inspector",
      isStopUpdate: false,
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
