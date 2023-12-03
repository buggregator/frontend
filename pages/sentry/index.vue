<script lang="ts">
import { defineComponent } from "vue";
import { useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PAGE_TYPES } from "~/src/shared/constants";
import PageIndex from "../index.vue"; // eslint-disable-line @conarti/feature-sliced/layers-slices

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
        title: "Sentry",
        type: PAGE_TYPES.SENTRY,
      };
    }

    return {
      events: [],
      title: "Sentry",
      type: PAGE_TYPES.SENTRY,
    };
  },
  head() {
    return {
      title: `Sentry [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
