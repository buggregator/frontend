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
        events: $events.itemsGroupByType[EVENT_TYPES.SMTP],
        title: "Smtp",
        eventsType: EVENT_TYPES.SMTP,
        savedEventsByType: $cachedEvents.savedEventsByType,
        clearEvents: () => $events.removeByType(EVENT_TYPES.SMTP),
        toggleUpdate: () => {
          if (
            $cachedEvents.savedEventsByType.value[EVENT_TYPES.SMTP].length > 0
          ) {
            $cachedEvents.runUpdatesByType(EVENT_TYPES.SMTP);
          } else {
            $cachedEvents.stopUpdatesByType(EVENT_TYPES.SMTP);
          }
        },
      };
    }

    return {
      events: [],
      title: "Smtp",
      eventsType: EVENT_TYPES.SMTP,
      savedEventsByType: {},
      clearEvents: () => {},
      toggleUpdate: () => {},
    };
  },
  head() {
    return {
      title: `SMTP [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
