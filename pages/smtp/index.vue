<script lang="ts">
import { defineComponent } from "vue";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useEvents } from "~/src/shared/lib/use-events";
import PageIndex from "../index.vue"; // eslint-disable-line @conarti/feature-sliced/layers-slices

export default defineComponent({
  extends: PageIndex,
  setup() {
    const { events } = useEvents();

    if (!events?.items?.value?.length) {
      events.getAll();
    }

    return {
      events: events.items,
      title: "Smtp",
      type: PAGE_TYPES.SMTP,
    };
  },
  head() {
    return {
      title: `SMTP [${this.events.length}] | Buggregator`,
    };
  },
});
</script>
