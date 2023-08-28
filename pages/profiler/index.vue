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
        events: $events.itemsGroupByType[EVENT_TYPES.PROFILER],
        title: "Profiler",
        eventsType: EVENT_TYPES.PROFILER,
      };
    }

    return {
      events: [],
      title: "Profiler",
      eventsType: EVENT_TYPES.PROFILER,
    };
  },
  head() {
    return {
      title: `Profiler [${this.events.length}] | Buggregator`,
    };
  },
  computed: {
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return (
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.PROFILER] &&
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.PROFILER].length > 0
      );
    },
    hiddenEventsCount() {
      const { $events, $cachedEvents } = useNuxtApp();

      const allInspectorEvents = $events.items.value.filter(
        ({ type }) => type === EVENT_TYPES.PROFILER
      );

      return (
        allInspectorEvents.length -
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.PROFILER].length
      );
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      return $events.removeByType(EVENT_TYPES.PROFILER);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(EVENT_TYPES.PROFILER);
      } else {
        $cachedEvents.stopUpdatesByType(EVENT_TYPES.PROFILER);
      }
    },
  },
});
</script>
