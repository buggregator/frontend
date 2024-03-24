<template>
  <div class="events-page">
    <PageHeader
      class="events-page__head"
      button-title="Clear events"
      @delete="clearEvents"
    >
      <NuxtLink to="/" :disabled="!title">Home</NuxtLink>

      <template v-if="title">
        <span>&nbsp;/&nbsp;</span>
        <NuxtLink :disabled="true">{{ title }}</NuxtLink>
      </template>

      <template #controls>
        <PauseButton
          :disabled="visibleEvents.length === 0"
          :is-paused="isEventsPaused"
          :total-new-events-count="hiddenEventsCount"
          @toggle-update="toggleUpdate"
        />
      </template>
    </PageHeader>

    <main v-if="visibleEvents.length" class="events-page__events">
      <EventCard
        v-for="event in visibleEvents"
        :key="event.uuid"
        :event="event"
        class="events-page__event"
      />
    </main>

    <section v-if="!visibleEvents.length" class="events-page__welcome">
      <PagePlaceholder class="events-page__tips" />
    </section>
  </div>
</template>

<script lang="ts">
// eslint-disable-next-line @conarti/feature-sliced/public-api
import pluralize from "pluralize";
import { defineComponent } from "vue";
import { PageHeader, EventCard, PagePlaceholder } from "~/src/widgets/ui";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventType } from "~/src/shared/types";
import { PauseButton } from "~/src/shared/ui/pause-button";

export default defineComponent({
  components: {
    PagePlaceholder,
    EventCard,
    PageHeader,
    PauseButton,
  },
  setup() {
    const { events } = useEvents();

    if (!events?.items?.value?.length) {
      events.getAll();
    }

    return {
      events: events.items,
      title: "",
      type: PAGE_TYPES.ALL_EVENTS,
    };
  },
  computed: {
    allEvents() {
      const { events } = useEvents();

      if (this.type === PAGE_TYPES.ALL_EVENTS) {
        return events.items.value;
      }
      return events.items.value.filter(({ type }) => type === this.type);
    },
    isEventsPaused() {
      const { cachedEvents } = useEvents();

      return cachedEvents.idsByType.value[this.type]?.length > 0;
    },
    visibleEvents() {
      if (!this.isEventsPaused) {
        return this.allEvents;
      }

      const { cachedEvents } = useEvents();

      return this.allEvents.filter(({ uuid }) =>
        cachedEvents.idsByType.value[this.type]?.includes(uuid)
      );
    },
    hiddenEventsCount() {
      return this.allEvents.length - this.visibleEvents.length;
    },
    titleEventsCount() {
      return `${pluralize("new event", this.hiddenEventsCount, true)}`;
    },
  },
  methods: {
    clearEvents() {
      const { events } = useEvents();

      if (this.type === PAGE_TYPES.ALL_EVENTS) {
        return events.removeAll();
      }

      return events.removeByType(this.type as EventType);
    },
    toggleUpdate() {
      const { cachedEvents } = useEvents();

      if (this.isEventsPaused) {
        cachedEvents.runUpdatesByType(this.type);
      } else {
        cachedEvents.stopUpdatesByType(this.type);
      }
    },
  },
});
</script>

<style lang="scss">
@import "assets/mixins";

.events-page {
  @include layout;
}

.events-page__head {
  @include layout-head;
}

.events-page__events {
  @include layout-body;
  @include border-style;
  @apply divide-y divide-y-2 divide-gray-200 dark:divide-gray-600;
}

.events-page__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
}

.events-page__welcome {
  @include layout-body;
  @apply min-h-screen;
  @apply flex-1 flex flex-col justify-center items-center;
  @apply bg-gray-50 dark:bg-gray-800;
}
</style>
