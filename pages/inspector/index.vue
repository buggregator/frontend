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
        title: "Inspector",
        type: PAGE_TYPES.INSPECTOR,
      };
    }

    return {
      events: [],
      title: "Inspector",
      type: PAGE_TYPES.INSPECTOR,
    };
  },
  head() {
    return {
      title: `Inspector [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
