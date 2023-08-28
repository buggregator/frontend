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
        events: $events.itemsGroupByType[EVENT_TYPES.HTTP_DUMP],
        title: "Http dumps",
        eventsType: EVENT_TYPES.HTTP_DUMP,
      };
    }

    return {
      events: [],
      title: "Http dumps",
      eventsType: EVENT_TYPES.HTTP_DUMP,
    };
  },
  head() {
    return {
      title: `Http dumps [${this.events.length}] | Buggregator`,
    };
  },
  computed: {
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return (
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.HTTP_DUMP] &&
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.HTTP_DUMP].length > 0
      );
    },
    hiddenEventsCount() {
      const { $events, $cachedEvents } = useNuxtApp();

      const allInspectorEvents = $events.items.value.filter(
        ({ type }) => type === EVENT_TYPES.HTTP_DUMP
      );

      return (
        allInspectorEvents.length -
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.HTTP_DUMP].length
      );
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      return $events.removeByType(EVENT_TYPES.HTTP_DUMP);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(EVENT_TYPES.HTTP_DUMP);
      } else {
        $cachedEvents.stopUpdatesByType(EVENT_TYPES.HTTP_DUMP);
      }
    },
  },
});
</script>
