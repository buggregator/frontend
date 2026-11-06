<script lang="ts" setup>
import { useTitle, refDebounced } from '@vueuse/core'
import { toBlob } from 'html-to-image'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { PAGE_TYPES } from '@/shared/constants'
import { copyTextToClipboard, copyBlobToClipboard } from '@/shared/lib/clipboard'
import { useEvents } from '@/shared/lib/use-events'
import { useKeyboardNav, showToast, screenshotingEventId } from '@/shared/lib/use-keyboard-nav'
import { useVirtualFeed } from '@/shared/lib/use-virtual-feed'
import { useEventsStore } from '@/shared/stores'
import { type PageEventTypes, RouteName } from '@/shared/types'
import { SkeletonLoader, StatusPanel } from '@/shared/ui'
import { EventCardMapper } from '../event-card-mapper'
import { PagePlaceholder } from '../page-placeholder'

type Props = {
  title?: string
  type: PageEventTypes
  favoritesOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  favoritesOnly: false
})

const { events, cachedEvents, lockedIds } = useEvents()

const isEventsPaused = computed(() => cachedEvents.idsByType.value[props.type]?.length > 0)

const allEvents = computed(() => {
  if (props.type === PAGE_TYPES.ALL_EVENT_TYPES) {
    return events.items.value
  }
  return events.items.value.filter(({ type }) => type === props.type)
})

const pauseFilteredEvents = computed(() => {
  if (!isEventsPaused.value) {
    return allEvents.value
  }

  return allEvents.value.filter(({ uuid }) =>
    cachedEvents.idsByType.value[props.type]?.includes(uuid)
  )
})

const { searchQuery, listState, listError } = storeToRefs(useEventsStore())
const debouncedSearch = refDebounced(searchQuery, 150)

const visibleEvents = computed(() => {
  let result = pauseFilteredEvents.value

  // Favorites mode: show only pinned events (across all types)
  if (props.favoritesOnly) {
    const allEvts = events.items.value
    result = allEvts.filter((e) => lockedIds.items.value.includes(e.uuid))
  }

  const query = debouncedSearch.value.toLowerCase().trim()
  if (!query) {
    return result
  }

  return result.filter((event) => {
    if (event.searchable_text) {
      return event.searchable_text.toLowerCase().includes(query)
    }
    return JSON.stringify(event.payload).toLowerCase().includes(query)
  })
})

const recentEventIds = ref(new Set<string>())
// Said by screen readers instead of the feed itself being a live region: the
// virtual feed mounts cards while scrolling, which would be read out too.
const newEventsNote = ref('')

watch(
  () => events.items.value.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      const newIds = events.items.value.slice(0, newLen - oldLen).map((e) => e.uuid)
      newIds.forEach((id) => recentEventIds.value.add(id))
      // the first list load is not news
      if (oldLen > 0 || newIds.length === 1) {
        newEventsNote.value = `${newIds.length} new ${newIds.length === 1 ? 'event' : 'events'}`
      }

      setTimeout(() => {
        newIds.forEach((id) => recentEventIds.value.delete(id))
      }, 2000)
    }
  }
)

const router = useRouter()
const eventUuids = computed(() => visibleEvents.value.map((e) => e.uuid))

// Only the cards near the screen are in the DOM (audit 2.3: 500 cards made
// ~37 000 nodes and a 1 s first render).
const { scroller, range, padTop, padBottom, scrollToKey } = useVirtualFeed(eventUuids)
const renderedEvents = computed(() =>
  visibleEvents.value
    .slice(range.value.start, range.value.end)
    .map((event, i) => ({ event, position: range.value.start + i + 1 }))
)

const { focusedId } = useKeyboardNav(eventUuids, {
  scrollToId: scrollToKey,
  onOpen: (id) => {
    const event = visibleEvents.value.find((e) => e.uuid === id)
    if (event) {
      router.push({
        name: RouteName.EventPage,
        params: { type: event.type as string, id: event.uuid }
      })
    }
  },
  onDelete: (id) => {
    if (lockedIds.items.value.includes(id)) {
      showToast('Event is pinned')
      return
    }
    events.removeById(id).then((ok) => ok && showToast('Event deleted'))
  },
  onLock: (id) => {
    if (lockedIds.items.value.includes(id)) {
      lockedIds.remove(id).then((ok) => ok && showToast('Event unpinned'))
    } else {
      lockedIds.add(id).then((ok) => ok && showToast('Event pinned'))
    }
  },
  onCopyPayload: (id) => {
    const event = visibleEvents.value.find((e) => e.uuid === id)
    if (event) {
      copyTextToClipboard(JSON.stringify(event.payload, null, 2)).then(() =>
        showToast('Payload copied')
      )
    }
  },
  onScreenshot: async (id) => {
    // the focused card may be off screen, so not rendered
    await scrollToKey(id, 'auto')
    const el = document.getElementById(id)
    if (el) {
      screenshotingEventId.value = id
      // Wait a tick for Vue to hide controls
      setTimeout(() => {
        toBlob(el as HTMLElement)
          .then((blob) => {
            if (blob) {
              copyBlobToClipboard(blob).then(() => showToast('Screenshot copied'))
            }
          })
          .finally(() => {
            screenshotingEventId.value = null
          })
      }, 50)
    }
  }
})

// Favorites count the pinned events, not the whole feed.
// The same number as the page header: every pinned event, search or not.
const titleCount = computed(() => {
  if (!props.favoritesOnly) {
    return allEvents.value.length
  }
  const pinnedIds = new Set(lockedIds.items.value)
  return events.items.value.filter(({ uuid }) => pinnedIds.has(uuid)).length
})

watchEffect(() => {
  useTitle(`${props.title || 'Events'}: ${titleCount.value} | Buggregator`)
})

// What the page shows when the feed has no card to show. A failed or running
// load is not "waiting for events", and an empty search or empty favorites
// say so instead of the SDK setup welcome.
// A search is checked before Favorites: pinned events that do not match the
// search are still favorites.
const emptyView = computed(() => {
  if (listState.value === 'loading' && !events.items.value.length) return 'loading'
  if (debouncedSearch.value.trim()) return 'no-match'
  if (props.favoritesOnly) return 'no-favorites'
  return 'welcome'
})

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<template>
  <div class="layout-preview-events">
    <!-- Above the cards: live events keep coming after a failed load. -->
    <StatusPanel
      v-if="listState === 'error'"
      tone="error"
      :compact="visibleEvents.length > 0"
      title="Could not load events"
      :text="listError"
      action-label="Try again"
      @action="events.getAll()"
    />

    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ newEventsNote }}
    </p>

    <main
      v-if="visibleEvents.length"
      ref="scroller"
      role="feed"
      :aria-label="`${props.title || 'Events'} feed, ${visibleEvents.length} items`"
      class="layout-preview-events__events"
    >
      <div
        class="layout-preview-events__list"
        :style="{ paddingTop: `${padTop}px`, paddingBottom: `${padBottom}px` }"
      >
        <EventCardMapper
          v-for="{ event, position } in renderedEvents"
          :id="event.uuid"
          :key="event.uuid"
          :event="event"
          role="article"
          :aria-posinset="position"
          :aria-setsize="visibleEvents.length"
          data-virtual-item
          class="layout-preview-events__event"
          :class="{
            'layout-preview-events__event--last': position === visibleEvents.length,
            'layout-preview-events__event--focused': focusedId === event.uuid,
            'layout-preview-events__event--animate': recentEventIds.has(event.uuid)
          }"
        />
      </div>
    </main>

    <template v-else-if="listState !== 'error'">
      <SkeletonLoader
        v-if="emptyView === 'loading'"
        variant="card"
        aria-label="Loading events"
      />

      <StatusPanel
        v-else-if="emptyView === 'no-favorites'"
        title="No favorites yet"
        text="Pin an event to keep it here. Pinned events also survive Clear."
      />

      <StatusPanel
        v-else-if="emptyView === 'no-match'"
        :title="`No events match “${debouncedSearch.trim()}”`"
        action-label="Clear search"
        @action="clearSearch"
      />

      <section
        v-else
        class="layout-preview-events__welcome"
      >
        <PagePlaceholder class="layout-preview-events__tips" />
      </section>
    </template>
  </div>
</template>

<style lang="scss">
@use 'src/assets/mixins' as mixins;

.layout-preview-events {
  @apply flex flex-col h-full w-full;
}

.layout-preview-events__events {
  @include mixins.border-style;
  @apply flex-1 overflow-y-auto;
  // useVirtualFeed keeps the first visible card in place itself.
  overflow-anchor: none;
}

// Every card has the same bottom border, whichever card is rendered first, so
// a card keeps its measured height when the rendered range moves.
.layout-preview-events__event {
  @apply border-b border-gray-200 dark:border-gray-700;
}

// The frame of the feed draws the last line.
.layout-preview-events__event--last {
  @apply border-b-0;
}

.layout-preview-events__event--animate {
  animation: event-enter 0.25s ease-out both;
}

@keyframes event-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.layout-preview-events__event--focused {
  @apply relative;
  @apply bg-blue-50/60 dark:bg-blue-500/[0.06];
  outline: 2px solid theme('colors.blue.500');
  outline-offset: -2px;
  z-index: 1;

  .dark & {
    outline-color: theme('colors.blue.400');
  }
}

.layout-preview-events__welcome {
  @apply flex-1 flex flex-col justify-center items-center;
  @apply bg-gray-50 dark:bg-gray-800;
}

.layout-preview-events__btn-stop-events {
  @apply mr-3 text-xs text-gray-800 dark:text-white rounded-sm hover:opacity-100 transition-all duration-300 opacity-40 relative;

  &[disabled] {
    @apply hover:opacity-40;
  }
}

.layout-preview-events__btn-stop-events--active {
  @apply opacity-100 text-blue-500 dark:text-blue-500;
}

.layout-preview-events__btn-stop-events-count {
  @apply absolute right-0 bottom-0 bg-red-600 text-white w-4 h-4 rounded-full flex justify-center;

  transform: translate(60%, -60%);
}

.layout-preview-events__clear-button {
  @include mixins.button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
