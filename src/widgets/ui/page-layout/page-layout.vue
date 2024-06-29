<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, watchEffect } from "vue";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useEvents } from "~/src/shared/lib/use-events";
import { useSettingsStore } from "~/src/shared/stores";
import type { TEventsGroup, EventType } from "~/src/shared/types";
import { BadgeNumber, PauseButton } from "~/src/shared/ui";
import { EventCard } from "../event-card";
import { PageHeader } from "../page-header";
import { PagePlaceholder } from "../page-placeholder";

type Props = {
  title?: string;
  type: TEventsGroup;
};

const props = withDefaults(defineProps<Props>(), {
  title: "",
});

const { events, cachedEvents, getItemsCount } = useEvents();
const { isVisibleEventCounts } = storeToRefs(useSettingsStore());

const isEventsPaused = computed(
  () => cachedEvents.idsByType.value[props.type]?.length > 0
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
    cachedEvents.idsByType.value[props.type]?.includes(uuid)
  );
});

const hiddenEventsCount = computed(
  () => events.items.value.length - visibleEvents.value.length
);

const clearEvents = () => {
  if (props.type === PAGE_TYPES.ALL_EVENTS) {
    return events.removeAll();
  }

  // TODO: fix types to sing EVENT_TYPES with PAGE_TYPES
  return events.removeByType(props.type as unknown as EventType);
};

const toggleUpdate = () => {
  if (isEventsPaused.value) {
    cachedEvents.runUpdatesByType(props.type);
  } else {
    cachedEvents.stopUpdatesByType(props.type);
  }
};

const badgeNumber = computed(() => getItemsCount.value(props.type));

watchEffect(() => {
  useTitle(
    `${props.title || "Events"}: ${allEvents.value.length} | Buggregator`
  );
});
</script>

<template>
  <div class="page-layout">
    <PageHeader class="page-layout__head">
      <NuxtLink to="/" :disabled="!title">Home</NuxtLink>

      <template v-if="title">
        <span>&nbsp;/&nbsp;</span>
        <NuxtLink :disabled="true">{{ title }}</NuxtLink>
      </template>

      <template #controls>
        <PauseButton
          :disabled-pause="visibleEvents.length === 0"
          :is-paused="isEventsPaused"
          :total-new-events-count="hiddenEventsCount"
          @toggle-update="toggleUpdate"
        />

        <BadgeNumber :number="badgeNumber" :is-visible="isVisibleEventCounts">
          <button class="page-layout__clear-button" @click="clearEvents">
            Clear events
          </button>
        </BadgeNumber>
      </template>
    </PageHeader>

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
  @include layout;
}

.page-layout__head {
  @include layout-head;
}

.page-layout__events {
  @include layout-body;
  @include border-style;
  @apply divide-y divide-y-2 divide-gray-200 dark:divide-gray-600;
}

.page-layout__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
}

.page-layout__welcome {
  @include layout-body;
  @apply min-h-screen;
  @apply flex-1 flex flex-col justify-center items-center;
  @apply bg-gray-50 dark:bg-gray-800;
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
