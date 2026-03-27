<script lang="ts" setup>
import { computed } from 'vue'
import { ALL_EVENT_TYPES } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import { type EventType, type PageEventTypes, RouteName } from '@/shared/types'
import { AppHeader, PauseButton, IconSvg } from '@/shared/ui'

const { events, cachedEvents } = useEvents()

type Props = {
  type: PageEventTypes
  title: string
}

const props = defineProps<Props>()

const clearEvents = () => {
  if (props.type === ALL_EVENT_TYPES) {
    return events.removeAll()
  }

  return events.removeByType(props.type as unknown as EventType)
}

const isEventsPaused = computed(() => cachedEvents.idsByType.value[props.type]?.length > 0)

const allEvents = computed(() => {
  if (props.type === ALL_EVENT_TYPES) {
    return events.items.value
  }
  return events.items.value.filter(({ type }) => type === props.type)
})

const visibleEvents = computed(() => {
  if (!isEventsPaused.value) {
    return allEvents.value
  }

  return allEvents.value.filter(({ uuid }) =>
    cachedEvents.idsByType.value[props.type]?.includes(uuid)
  )
})

const hiddenEventsCount = computed(() => allEvents.value.length - visibleEvents.value.length)

const toggleUpdate = () => {
  if (isEventsPaused.value) {
    cachedEvents.runUpdatesByType(props.type)
  } else {
    cachedEvents.stopUpdatesByType(props.type)
  }
}
</script>

<template>
  <AppHeader>
    <RouterLink
      :to="{ name: RouteName.Home }"
      class="nav__crumb"
      :disabled="!title"
    >
      Home
    </RouterLink>

    <template v-if="title">
      <span class="nav__sep">/</span>
      <span class="nav__current">{{ title }}</span>
    </template>

    <span
      v-if="allEvents.length > 0"
      class="nav__count"
    >
      {{ allEvents.length }}
    </span>

    <template #controls>
      <PauseButton
        :disabled-pause="visibleEvents.length === 0"
        :is-paused="isEventsPaused"
        :total-new-events-count="hiddenEventsCount"
        @toggle-update="toggleUpdate"
      />

      <button
        class="action-btn action-btn--danger"
        title="Clear all events"
        aria-label="Clear all events"
        @click="clearEvents"
      >
        <IconSvg
          name="trash-bin"
          class="action-btn__icon"
        />
        <span class="action-btn__text">Clear</span>
      </button>
    </template>
  </AppHeader>
</template>

<style lang="scss" scoped>
.nav__crumb {
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors;
}

.nav__sep {
  @apply text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.nav__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.nav__count {
  @apply text-2xs font-mono tabular-nums ml-2;
  @apply px-1.5 py-0.5 rounded-full;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-500 dark:text-gray-400;
  @apply self-center;
}

/* Action buttons */
.action-btn {
  @apply h-7 flex items-center gap-1.5 px-2.5 rounded;
  @apply text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.action-btn--danger {
  @apply hover:text-red-600 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
}

.action-btn__icon {
  @apply w-3.5 h-3.5;
}

.action-btn__text {
  @apply hidden sm:inline;
}
</style>
