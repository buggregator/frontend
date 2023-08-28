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
        events: $events.itemsGroupByType[EVENT_TYPES.INSPECTOR],
        title: "Inspector",
        eventsType: EVENT_TYPES.INSPECTOR,
      };
    }

    return {
      events: [],
      title: "Inspector",
      eventsType: EVENT_TYPES.INSPECTOR,
    };
  },
  head() {
    return {
      title: `Inspector [${this.events.length}] | Buggregator`,
    };
  },
  computed: {
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return (
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.INSPECTOR] &&
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.INSPECTOR].length > 0
      );
    },
    hiddenEventsCount() {
      const { $events, $cachedEvents } = useNuxtApp();

      const allInspectorEvents = $events.items.value.filter(
        ({ type }) => type === EVENT_TYPES.INSPECTOR
      );

      return (
        allInspectorEvents.length -
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.INSPECTOR].length
      );
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      return $events.removeByType(EVENT_TYPES.INSPECTOR);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(EVENT_TYPES.INSPECTOR);
      } else {
        $cachedEvents.stopUpdatesByType(EVENT_TYPES.INSPECTOR);
      }
    },
  },
});
</script>
