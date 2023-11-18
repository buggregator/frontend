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
        <button
          class="events-page__btn-stop-events"
          :class="{ 'events-page__btn-stop-events--active': isEventsPaused }"
          :disabled="visibleEvents.length === 0"
          @click="toggleUpdate"
        >
          {{ isEventsPaused ? "❚ ❚ Pause Fetching" : "▶ Auto Fetching" }}
          <span
            v-if="isEventsPaused && hiddenEventsCount"
            class="events-page__btn-stop-events-count"
            :title="titleEventsCount"
          >
            {{ hiddenEventsCount }}
          </span>
        </button>
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
import { defineComponent } from "vue";
import { PageHeader, EventCard, PagePlaceholder } from "~/src/widgets/ui";
import { useNuxtApp } from "#app";
import { PAGE_TYPES } from "~/src/shared/constants";
import pluralize from "pluralize";
import { EventType } from "~/src/shared/types";

export default defineComponent({
  components: {
    PagePlaceholder,
    EventCard,
    PageHeader,
  },
  setup() {
    if (process.client) {
      const { $events } = useNuxtApp();

      if (!$events?.items?.value?.length) {
        $events.getAll();
      }

      return {
        events: $events.items,
        title: "",
        type: PAGE_TYPES.ALL_EVENTS,
      };
    }
    return {
      events: [],
      title: "",
      type: PAGE_TYPES.ALL_EVENTS,
    };
  },
  computed: {
    allEvents() {
      const { $events } = useNuxtApp();

      if (this.type === PAGE_TYPES.ALL_EVENTS) {
        return $events.items.value;
      }
      return $events.items.value.filter(({ type }) => type === this.type);
    },
    isEventsPaused() {
      const { $cachedEvents } = useNuxtApp();

      return $cachedEvents.eventsIdsByType.value[this.type].length > 0;
    },
    visibleEvents() {
      if (!this.isEventsPaused) {
        return this.allEvents;
      }

      const { $cachedEvents } = useNuxtApp();

      return this.allEvents.filter(({ uuid }) =>
        $cachedEvents.eventsIdsByType.value[this.type].includes(uuid)
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
      const { $events } = useNuxtApp();

      if (this.type === PAGE_TYPES.ALL_EVENTS) {
        return $events.removeAll();
      }

      return $events.removeByType(this.type as EventType);
    },
    toggleUpdate() {
      const { $cachedEvents } = useNuxtApp();

      if (this.isEventsPaused) {
        $cachedEvents.runUpdatesByType(this.type);
      } else {
        $cachedEvents.stopUpdatesByType(this.type);
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
  @apply flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-800 min-h-screen;
}

.events-page__btn-stop-events {
  @apply mr-3 text-xs text-gray-800 dark:text-white rounded-sm hover:opacity-100 transition-all duration-300 opacity-40 relative;

  &[disabled] {
    @apply hover:opacity-40;
  }
}

.events-page__btn-stop-events--active {
  @apply opacity-100 text-blue-500 dark:text-blue-500;
}

.events-page__btn-stop-events-count {
  @apply absolute right-0 bottom-0 bg-red-600 text-white w-4 h-4 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}
</style>
