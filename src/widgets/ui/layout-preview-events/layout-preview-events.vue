<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { PAGE_TYPES } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import { useKeyboardNav } from '@/shared/lib/use-keyboard-nav'
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

const { events, cachedEvents } = useEvents()

const isEventsPaused = computed(() => cachedEvents.idsByType.value[props.type]?.length > 0)

const allEvents = computed(() => {
  if (props.type === PAGE_TYPES.ALL_EVENT_TYPES) {
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
  }
})

watchEffect(() => {
  useTitle(`${props.title || 'Events'}: ${allEvents.value.length} | Buggregator`)
})
</script>

<template>
  <div class="layout-preview-events">
    <main
      v-if="visibleEvents.length"
      role="feed"
      :aria-label="`${props.title || 'Events'} feed, ${visibleEvents.length} items`"
      aria-live="polite"
      class="layout-preview-events__events"
    >
      <EventCardMapper
        v-for="(event, index) in visibleEvents"
        :key="event.uuid"
        :event="event"
        role="article"
        class="layout-preview-events__event"
        :class="{ 'layout-preview-events__event--focused': focusedId === event.uuid }"
        :style="index < 20 ? { animationDelay: `${index * 30}ms` } : undefined"
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

.layout-preview-events__events {
  @include mixins.border-style;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.layout-preview-events__event {
  animation: event-enter 0.25s ease-out both;

  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
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
  @apply ring-2 ring-blue-500 ring-inset;
  @apply bg-blue-50/50 dark:bg-blue-900/10;
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
