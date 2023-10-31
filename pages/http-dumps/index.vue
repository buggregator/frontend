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
        title: "Http dumps",
        type: PAGE_TYPES.HTTP_DUMP,
      };
    }

    return {
      events: [],
      title: "Http dumps",
      type: PAGE_TYPES.HTTP_DUMP,
    };
  },
  head() {
    return {
      title: `Http dumps [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
