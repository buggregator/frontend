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
        events: $events.itemsGroupByType[EVENT_TYPES.SENTRY],
        title: "Sentry",
        eventsType: EVENT_TYPES.SENTRY,
      };
    }

    return {
      events: [],
      title: "Sentry",
      eventsType: EVENT_TYPES.SENTRY,
    };
  },
  head() {
    return {
      title: `Sentry [${this.events.length}] | Buggregator`,
    };
  },
  computed: {
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return (
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SENTRY] &&
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SENTRY].length > 0
      );
    },
    hiddenEventsCount() {
      const { $events, $cachedEvents } = useNuxtApp();

      const allInspectorEvents = $events.items.value.filter(
        ({ type }) => type === EVENT_TYPES.SENTRY
      );

      return (
        allInspectorEvents.length -
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SENTRY].length
      );
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      return $events.removeByType(EVENT_TYPES.SENTRY);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(EVENT_TYPES.SENTRY);
      } else {
        $cachedEvents.stopUpdatesByType(EVENT_TYPES.SENTRY);
      }
    },
  },
});
</script>
