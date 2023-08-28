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
      return {
        events: $events.items,
        title: "Sentry",
        type: EVENT_TYPES.SENTRY,
      };
    }

    return {
      events: [],
      title: "Sentry",
      type: EVENT_TYPES.SENTRY,
    };
  },
  head() {
    return {
      title: `Sentry [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
