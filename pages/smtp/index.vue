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
        $cachedEvents.itemsGroupByType[EVENT_TYPES.SMTP].value.length;
      const visibleEvents = isStopUpdate
        ? $cachedEvents.itemsGroupByType[EVENT_TYPES.SMTP]
        : $events.itemsGroupByType[EVENT_TYPES.SMTP];

      return {
        events: visibleEvents,
        title: "Smtp",
        isStopUpdate,
        clearEvents: () => $events.removeByType(EVENT_TYPES.SMTP),
        stopUpdate: () => {
          $cachedEvents.stopUpdatesByType(EVENT_TYPES.SMTP);
        },
      };
    }

    return {
      events: [],
      title: "Smtp",
      isStopUpdate: false,
      clearEvents: () => {},
      stopUpdate: () => {},
    };
  },
  head() {
    return {
      title: `SMTP [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
