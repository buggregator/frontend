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
        events: $events.itemsGroupByType[EVENT_TYPES.INSPECTOR],
        title: "Inspector",
        clearEvents: () => $events.removeByType(EVENT_TYPES.INSPECTOR),
      };
    }

    return {
      events: [],
      title: "Inspector",
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
