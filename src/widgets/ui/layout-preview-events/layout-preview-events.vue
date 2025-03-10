<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { PAGE_TYPES } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import type { PageEventTypes } from '@/shared/types'
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

watchEffect(() => {
  useTitle(`${props.title || 'Events'}: ${allEvents.value.length} | Buggregator`)
})
</script>

<template>
  <div class="layout-preview-events">
    <main
      v-if="visibleEvents.length"
      class="layout-preview-events__events"
    >
      <EventCardMapper
        v-for="event in visibleEvents"
        :key="event.uuid"
        :event="event"
        class="layout-preview-events__event"
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
  @apply divide-y divide-y-2 divide-gray-200 dark:divide-gray-600;
}

.layout-preview-events__event {
  & + & {
    @apply border-b border-gray-200 dark:border-gray-700;
  }
}

.layout-preview-events__welcome {
  @apply flex-1 flex flex-col justify-center items-center;
  @apply bg-gray-50 dark:bg-gray-800 mb-[10vh];
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
