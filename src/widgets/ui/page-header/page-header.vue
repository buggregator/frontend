<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent } from 'vue'
import { ALL_EVENT_TYPES, PAGES_SETTINGS } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import { useEventsStore } from '@/shared/stores'
import { type PageEventTypes, RouteName } from '@/shared/types'
import { AppHeader, PauseButton, IconSvg, PeriodSelect, SearchBar } from '@/shared/ui'
import { SetupHelpButton, hasSetupHelp } from '../setup-guide'

// Its own chunk: the first load does not grow with it.
const FeedFilterBar = defineAsyncComponent(() => import('../feed-filter-bar').then((m) => m.FeedFilterBar))

const { events, cachedEvents, lockedIds } = useEvents()
const eventsStore = useEventsStore()
const { searchQuery } = storeToRefs(eventsStore)

type Props = {
  type: PageEventTypes
  title: string
  favoritesOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), { favoritesOnly: false })

// Clear cannot be undone, so it always asks first. No count: the server holds
// more events than the browser has loaded, and pinned ones are kept.
const clearMessage = computed(() => {
  const what = props.type === ALL_EVENT_TYPES ? 'events' : `${props.title} events`
  const pinned = lockedIds.items.value.length > 0 ? ' Pinned events stay.' : ''

  return `Delete all ${what} in this project? This cannot be undone.${pinned}`
})

const clearEvents = () => {
  if (!window.confirm(clearMessage.value)) {
    return undefined
  }

  if (props.type === ALL_EVENT_TYPES) {
    return events.removeAll()
  }

  return events.removeByType(props.type)
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

// Favorites count the pinned events only (audit 5.4: it showed the whole feed).
const shownCount = computed(() => {
  if (!props.favoritesOnly) {
    return allEvents.value.length
  }
  const pinned = new Set(lockedIds.items.value)
  return events.items.value.filter(({ uuid }) => pinned.has(uuid)).length
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
      <span
        class="nav__sep"
        aria-hidden="true"
      >/</span>
      <span class="nav__current">{{ title }}</span>
    </template>

    <span
      v-if="shownCount > 0"
      class="nav__count"
    >
      {{ shownCount }}
    </span>

    <template #controls>
      <SearchBar v-model="searchQuery" />

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

      <!-- An empty section shows the guide itself. -->
      <SetupHelpButton
        v-if="hasSetupHelp(type) && allEvents.length > 0"
        :section-id="type"
        :section-title="PAGES_SETTINGS[type].sidebarTitle"
      />
    </template>

    <!-- Row 2 (design #6737 A): the feed filters, the period on the right. -->
    <template #toolbar>
      <FeedFilterBar class="page-header__filters" />
      <PeriodSelect />
    </template>
  </AppHeader>
</template>

<style lang="scss" scoped>
.page-header__filters {
  @apply flex-1;
}

.nav__count {
  @apply text-2xs font-mono tabular-nums ml-2;
  @apply px-1.5 py-0.5 rounded-full;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-gray-600 dark:text-gray-300;
  @apply self-center;
}
</style>
