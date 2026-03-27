<script lang="ts" setup>
import { useTitle, refDebounced } from '@vueuse/core'
import { toBlob } from 'html-to-image'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { PAGE_TYPES } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import { useKeyboardNav, showToast, screenshotingEventId } from '@/shared/lib/use-keyboard-nav'
import { useEventsStore } from '@/shared/stores'
import { type PageEventTypes, RouteName } from '@/shared/types'
import { EventCardMapper } from '../event-card-mapper'
import { PagePlaceholder } from '../page-placeholder'

type Props = {
  title?: string
  type: PageEventTypes
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
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

const { searchQuery } = storeToRefs(useEventsStore())
const debouncedSearch = refDebounced(searchQuery, 150)

const visibleEvents = computed(() => {
  const query = debouncedSearch.value.toLowerCase().trim()
  if (!query) {
    return pauseFilteredEvents.value
  }

  return pauseFilteredEvents.value.filter((event) => {
    if (event.searchable_text) {
      return event.searchable_text.toLowerCase().includes(query)
    }
    return JSON.stringify(event.payload).toLowerCase().includes(query)
  })
})

const recentEventIds = ref(new Set<string>())

watch(
  () => events.items.value.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      const newIds = events.items.value.slice(0, newLen - oldLen).map((e) => e.uuid)
      newIds.forEach((id) => recentEventIds.value.add(id))

      setTimeout(() => {
        newIds.forEach((id) => recentEventIds.value.delete(id))
      }, 2000)
    }
  }
)

// Split pinned vs regular
const pinnedEvents = computed(() =>
  visibleEvents.value.filter((e) => lockedIds.items.value.includes(e.uuid))
)
const regularEvents = computed(() =>
  visibleEvents.value.filter((e) => !lockedIds.items.value.includes(e.uuid))
)

const router = useRouter()
const eventUuids = computed(() => visibleEvents.value.map((e) => e.uuid))
const { focusedId } = useKeyboardNav(eventUuids, {
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
    events.removeById(id)
    showToast('Event deleted')
  },
  onLock: (id) => {
    if (lockedIds.items.value.includes(id)) {
      lockedIds.remove(id)
      showToast('Event unpinned')
    } else {
      lockedIds.add(id)
      showToast('Event pinned')
    }
  },
  onCopyPayload: (id) => {
    const event = visibleEvents.value.find((e) => e.uuid === id)
    if (event) {
      navigator.clipboard
        .writeText(JSON.stringify(event.payload, null, 2))
        .then(() => showToast('Payload copied'))
    }
  },
  onScreenshot: (id) => {
    const el = document.getElementById(id)
    if (el) {
      screenshotingEventId.value = id
      // Wait a tick for Vue to hide controls
      setTimeout(() => {
        toBlob(el as HTMLElement)
          .then((blob) => {
            if (blob) {
              navigator.clipboard
                .write([new ClipboardItem({ [blob.type]: blob })])
                .then(() => showToast('Screenshot copied'))
            }
          })
          .finally(() => {
            screenshotingEventId.value = null
          })
      }, 50)
    }
  }
})

watchEffect(() => {
  useTitle(`${props.title || 'Events'}: ${allEvents.value.length} | Buggregator`)
})
</script>

<template>
  <div class="layout-preview-events">
    <!-- Pinned events -->
    <section
      v-if="pinnedEvents.length"
      class="layout-preview-events__pinned"
    >
      <div class="layout-preview-events__pinned-header">
        <svg class="layout-preview-events__pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 17v5" /><path d="M9 11V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" /><path d="M5 15h14l-1.5-4H6.5z" />
        </svg>
        Pinned
        <span class="layout-preview-events__pinned-count">{{ pinnedEvents.length }}</span>
      </div>
      <div class="layout-preview-events__pinned-list">
        <EventCardMapper
          v-for="event in pinnedEvents"
          :id="event.uuid"
          :key="event.uuid"
          :event="event"
          role="article"
          class="layout-preview-events__event"
          :class="{
            'layout-preview-events__event--focused': focusedId === event.uuid,
          }"
        />
      </div>
    </section>

    <!-- Regular events -->
    <main
      v-if="regularEvents.length"
      role="feed"
      :aria-label="`${props.title || 'Events'} feed, ${regularEvents.length} items`"
      aria-live="polite"
      class="layout-preview-events__events"
    >
      <EventCardMapper
        v-for="event in regularEvents"
        :id="event.uuid"
        :key="event.uuid"
        :event="event"
        role="article"
        class="layout-preview-events__event"
        :class="{
          'layout-preview-events__event--focused': focusedId === event.uuid,
          'layout-preview-events__event--animate': recentEventIds.has(event.uuid)
        }"
      />
    </main>

    <section
      v-if="!visibleEvents.length"
      class="layout-preview-events__welcome"
    >
      <PagePlaceholder class="layout-preview-events__tips" />
    </section>
  </div>
</template>

<style lang="scss">
@use 'src/assets/mixins' as mixins;

.layout-preview-events {
  @apply flex flex-col h-full w-full;
}

/* Pinned section */
.layout-preview-events__pinned {
  @apply flex-shrink-0;
  @apply border-b-2 border-amber-200 dark:border-amber-500/20;
}

.layout-preview-events__pinned-header {
  @apply flex items-center gap-1.5;
  @apply px-4 py-1.5;
  @apply text-2xs font-semibold uppercase tracking-wider;
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/5;
}

.layout-preview-events__pin-icon {
  @apply w-3 h-3;
}

.layout-preview-events__pinned-count {
  @apply font-normal text-amber-400 dark:text-amber-500;
  @apply ml-0.5;
}

.layout-preview-events__pinned-list {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.layout-preview-events__events {
  @include mixins.border-style;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
  @apply flex-1 overflow-y-auto;
}

.layout-preview-events__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
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
