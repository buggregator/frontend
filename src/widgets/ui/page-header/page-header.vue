<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { ALL_EVENT_TYPES } from "@/shared/constants";
import { useEvents } from "@/shared/lib/use-events";
import { useSettingsStore } from "@/shared/stores";
import { type EventType, type PageEventTypes, RouteName } from "@/shared/types";
import { AppHeader, BadgeNumber, PauseButton } from "@/shared/ui";

const { events, cachedEvents, getItemsCount } = useEvents();
const { isVisibleEventCounts } = storeToRefs(useSettingsStore());

type Props = {
  type: PageEventTypes;
  title: string;
};

const props = defineProps<Props>();

const clearEvents = () => {
  if (props.type === ALL_EVENT_TYPES) {
    return events.removeAll();
  }

  return events.removeByType(props.type as unknown as EventType);
};

const isEventsPaused = computed(() =>
  cachedEvents.idsByType.value[props.type]?.length > 0);

const allEvents = computed(() => {
  if (props.type === ALL_EVENT_TYPES) {
    return events.items.value;
  }
  return events.items.value.filter(({ type }) =>
    type === props.type);
});

const visibleEvents = computed(() => {
  if (!isEventsPaused.value) {
    return allEvents.value;
  }

  return allEvents.value.filter(({ uuid }) =>
    cachedEvents.idsByType.value[props.type]?.includes(uuid));
});

const hiddenEventsCount = computed(() =>
  allEvents.value.length - visibleEvents.value.length);

const toggleUpdate = () => {
  if (isEventsPaused.value) {
    cachedEvents.runUpdatesByType(props.type);
  } else {
    cachedEvents.stopUpdatesByType(props.type);
  }
};

const badgeNumber = computed(() =>
  getItemsCount.value(props.type !== ALL_EVENT_TYPES ? (props.type as EventType) : undefined));
</script>

<template>
  <AppHeader class="page-header">
    <RouterLink
      :to="{ name: RouteName.Home }"
      :disabled="!title"
    >
      Home
    </RouterLink>

    <template v-if="title">
      <span>&nbsp;/&nbsp;</span>
      <div disabled>
        {{ title }}
      </div>
    </template>

    <template #controls>
      <PauseButton
        :disabled-pause="visibleEvents.length === 0"
        :is-paused="isEventsPaused"
        :total-new-events-count="hiddenEventsCount"
        @toggle-update="toggleUpdate"
      />

      <BadgeNumber
        :number="badgeNumber"
        :is-visible="isVisibleEventCounts"
      >
        <button
          class="page-header__clear-button"
          @click="clearEvents"
        >
          Clear events
        </button>
      </BadgeNumber>
    </template>
  </AppHeader>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.page-header {
  @apply flex justify-between h-full;
}

.page-header__clear-button {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
