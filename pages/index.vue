<template>
  <div class="events-page">
    <PageHeader button-title="Clear events" @delete="clearEvents">
      <NuxtLink to="/" :disabled="!title">Home</NuxtLink>

      <template v-if="title">
        <span>&nbsp;/&nbsp;</span>
        <NuxtLink :disabled="true">{{ title }}</NuxtLink>
      </template>

      <template v-if="Boolean(type)" #controls>
        <button
          class="events-page__btn-stop-events"
          :class="{ 'events-page__btn-stop-events--active': isEventsPaused }"
          @click="toggleUpdate"
        >
          {{ isEventsPaused ? "❚ ❚ Pause Fetching" : "▶ Auto Fetching" }}
          <span
            v-if="isEventsPaused && hiddenEventsCount"
            class="events-page__btn-stop-events-count"
            :title="hiddenEventsCount + ' new events'"
          >
            {{ hiddenEventsCount }}
          </span>
        </button>
      </template>
    </PageHeader>

    <main v-if="visibleEvents.length" class="events-page__events">
      <PreviewEventMapper
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
import PagePlaceholder from "~/components/PagePlaceholder/PagePlaceholder.vue";
import PageHeader from "~/components/PageHeader/PageHeader.vue";
import { useNuxtApp } from "#app";
import PreviewEventMapper from "~/components/PreviewEventMapper/PreviewEventMapper.vue";
import { ALL_EVENTS } from "~/config/constants";

export default defineComponent({
  components: {
    PagePlaceholder,
    PreviewEventMapper,
    PageHeader,
  },
  setup() {
    if (process.client) {
      const { $events } = useNuxtApp();

      if (!$events?.items?.value.length) {
        $events.getAll();
      }

      return {
        events: $events.items,
        title: "",
        type: ALL_EVENTS,
      };
    }
    return {
      events: [],
      title: "",
      type: ALL_EVENTS,
    };
  },
  computed: {
    allEvents() {
      const { $events } = useNuxtApp();

      if (this.type === ALL_EVENTS) {
        return $events.items.value;
      }
      return $events.items.value.filter(({ type }) => type === this.type);
    },
    cachedEvents() {
      const { $cachedEvents } = useNuxtApp();

      return $cachedEvents.savedEventsByType.value[this.type];
    },
    isEventsPaused() {
      return this.cachedEvents.length > 0;
    },
    visibleEvents() {
      return this.isEventsPaused ? this.cachedEvents : this.allEvents;
    },
    hiddenEventsCount() {
      return this.allEvents.length - this.cachedEvents.length;
    },
  },
  methods: {
    clearEvents() {
      const { $events } = useNuxtApp();

      if (this.type === ALL_EVENTS) {
        return $events.removeAll();
      }

      return $events.removeByType(this.type);
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
  @apply h-full w-full;
}

.events-page__events {
  @include border-style;
  @apply flex flex-col divide-y divide-y-2 divide-gray-200 dark:divide-gray-600;
}

.events-page__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
}

.events-page__welcome {
  @apply flex-1 p-4 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-800 w-full h-full min-h-screen;
}

.events-page__btn-stop-events {
  @apply mr-3 text-xs text-white rounded-sm hover:opacity-100 transition-all duration-300 opacity-40 relative;
}

.events-page__btn-stop-events--active {
  @apply opacity-100 text-blue-500;
}

.events-page__btn-stop-events-count {
  @apply absolute right-0 bottom-0 bg-red-600 text-white w-4 h-4 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}
</style>
