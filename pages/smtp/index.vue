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

      if (!$events?.items?.length) {
        $events.getAll();
      }

      return {
        events: $events.itemsGroupByType[EVENT_TYPES.SMTP],
        title: "Smtp",
        clearEvents: () => $events.removeByType(EVENT_TYPES.SMTP),
      };
    }

    return {
      events: [],
      title: "Smtp",
      clearEvents: () => {},
    };
  },
  head() {
    return {
      title: `SMTP [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
