<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, watchEffect } from "vue";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useEvents } from "~/src/shared/lib/use-events";
import type { TEventsGroup } from "~/src/shared/types";
import { EventCard } from "../event-card";
import { PagePlaceholder } from "../page-placeholder";

type Props = {
  title?: string;
  type: TEventsGroup;
};

const props = withDefaults(defineProps<Props>(), {
  title: "",
});

const { events, cachedEvents } = useEvents();

const isEventsPaused = computed(
  () => cachedEvents.idsByType.value[props.type]?.length > 0,
);

const allEvents = computed(() => {
  if (props.type === PAGE_TYPES.ALL_EVENTS) {
    return events.items.value;
  }
  return events.items.value.filter(({ type }) => type === props.type);
});

const visibleEvents = computed(() => {
  if (!isEventsPaused.value) {
    return allEvents.value;
  }

  return allEvents.value.filter(({ uuid }) =>
    cachedEvents.idsByType.value[props.type]?.includes(uuid),
  );
});

watchEffect(() => {
  useTitle(
    `${props.title || "Events"}: ${allEvents.value.length} | Buggregator`,
  );
});
</script>

<template>
  <div class="page-layout">
    <main v-if="visibleEvents.length" class="page-layout__events">
      <EventCard
        v-for="event in visibleEvents"
        :key="event.uuid"
        :event="event"
        class="page-layout__event"
      />
    </main>

    <section v-if="!visibleEvents.length" class="page-layout__welcome">
      <PagePlaceholder class="page-layout__tips" />
    </section>
  </div>
</template>

<style lang="scss">
@import "src/assets/mixins";

.page-layout {
  @apply flex flex-col h-full w-full;
}

.page-layout__events {
  @include border-style;
  @apply divide-y divide-y-2 divide-gray-200 dark:divide-gray-600;
}

.page-layout__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
}

.page-layout__welcome {
  @apply flex-1 flex flex-col justify-center items-center;
  @apply bg-gray-50 dark:bg-gray-800 mb-[10vh];
}

.page-layout__btn-stop-events {
  @apply mr-3 text-xs text-gray-800 dark:text-white rounded-sm hover:opacity-100 transition-all duration-300 opacity-40 relative;

  &[disabled] {
    @apply hover:opacity-40;
  }
}

.page-layout__btn-stop-events--active {
  @apply opacity-100 text-blue-500 dark:text-blue-500;
}

.page-layout__btn-stop-events-count {
  @apply absolute right-0 bottom-0 bg-red-600 text-white w-4 h-4 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}

.page-layout__clear-button {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
