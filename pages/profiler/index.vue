<script lang="ts">
import { defineComponent } from "vue";
import PageIndex from "~/pages/index.vue";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useNuxtApp } from "#app";

export default defineComponent({
  extends: PageIndex,
  setup() {
    if (process.client) {
      const { $events } = useNuxtApp();

      if (!$events?.items?.value?.length) {
        $events.getAll();
      }
      return {
        events: $events.items,
        title: "Profiler",
        type: PAGE_TYPES.PROFILER,
      };
    }

    return {
      events: [],
      title: "Profiler",
      type: PAGE_TYPES.PROFILER,
    };
  },
  head() {
    return {
      title: `Profiler [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
