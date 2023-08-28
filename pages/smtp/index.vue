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
        events: $events.itemsGroupByType[EVENT_TYPES.SMTP],
        title: "Smtp",
        eventsType: EVENT_TYPES.SMTP,
      };
    }

    return {
      events: [],
      title: "Smtp",
      eventsType: EVENT_TYPES.SMTP,
    };
  },
  head() {
    return {
      title: `SMTP [${this.events.length}] | Buggregator`,
    };
  },
  computed: {
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return (
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SMTP] &&
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SMTP].length > 0
      );
    },
    hiddenEventsCount() {
      const { $events, $cachedEvents } = useNuxtApp();

      const allInspectorEvents = $events.items.value.filter(
        ({ type }) => type === EVENT_TYPES.SMTP
      );

      return (
        allInspectorEvents.length -
        $cachedEvents.savedEventsByType.value[EVENT_TYPES.SMTP].length
      );
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      return $events.removeByType(EVENT_TYPES.SMTP);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(EVENT_TYPES.SMTP);
      } else {
        $cachedEvents.stopUpdatesByType(EVENT_TYPES.SMTP);
      }
    },
  },
});
</script>
