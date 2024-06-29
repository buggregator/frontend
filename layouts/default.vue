<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed, onMounted, watchEffect } from "vue";
import { LayoutSidebar, PageHeader } from "~/src/widgets/ui";
import { PAGE_TYPES } from "~/src/shared/constants";
import { useEvents } from "~/src/shared/lib/use-events";
import SfdumpWrap from "~/src/shared/lib/vendor/dumper";
import { useSettingsStore } from "~/src/shared/stores";
import type { EventType } from "~/src/shared/types";
import { BadgeNumber, PauseButton } from "~/src/shared/ui";

SfdumpWrap(window.document);

onMounted(() => {
  const { events } = useEvents();

  if (!events?.items?.value?.length) {
    events.getAll();
  }
});

const { events, cachedEvents, getItemsCount } = useEvents();
const { isVisibleEventCounts } = storeToRefs(useSettingsStore());

const title = "Home";
const props = {
  type: PAGE_TYPES.ALL_EVENTS,
};

const clearEvents = () => {
  if (props.type === PAGE_TYPES.ALL_EVENTS) {
    return events.removeAll();
  }

  // TODO: fix types to sing EVENT_TYPES with PAGE_TYPES
  return events.removeByType(props.type as unknown as EventType);
};

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

const toggleUpdate = () => {
  if (isEventsPaused.value) {
    cachedEvents.runUpdatesByType(props.type);
  } else {
    cachedEvents.stopUpdatesByType(props.type);
  }
};

const badgeNumber = computed(() =>
  getItemsCount.value(
    props.type !== PAGE_TYPES.ALL_EVENTS
      ? (props.type as unknown as EventType)
      : undefined
  )
);

watchEffect(() => {});
</script>

<template>
  <div class="main-layout">
    <LayoutSidebar class="main-layout__sidebar" />

    <div class="main-layout__header">
      <PageHeader>
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
            <button class="main-layout__clear-button" @click="clearEvents">
              Clear events
            </button>
          </BadgeNumber>
        </template>
      </PageHeader>
    </div>

    <div class="main-layout__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.main-layout {
  @apply flex min-h-screen items-stretch relative;
}

.main-layout__sidebar {
  @apply w-10 md:w-14 lg:w-16 flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
  @include layout-sidebar;
}

.main-layout__header {
  @include layout-head;
}

.main-layout__content {
  @include layout-body;
  @apply flex flex-col h-full flex-1 w-full min-h-screen;

  & > div {
    @apply flex flex-col h-full flex-1;
  }
}

.main-layout__clear-button {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
