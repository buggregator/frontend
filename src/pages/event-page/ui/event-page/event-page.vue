<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KeyHintBar, LayoutBase, LayoutSidebar, PageEventHeader } from '@/widgets/ui'
import { EventPageMapper } from '@/widgets/ui/event-page-mapper'
import { PAGES_SETTINGS } from '@/shared/constants'
import { describeLoadError } from '@/shared/lib/io'
import { logger } from '@/shared/lib/logger'
import { useKeyHints } from '@/shared/lib/shortcuts'
import { useEvents } from '@/shared/lib/use-events'
import { type EventId, type PageEventTypes, type ServerEvent, isEventType } from '@/shared/types'
import { SkeletonLoader } from '@/shared/ui/skeleton-loader'
import { StatusPanel } from '@/shared/ui/status-panel'

const route = useRoute()
const router = useRouter()
const { showHintBar } = useKeyHints()
// The router keeps this page when only :id changes (a desktop notification
// opens another error while one is open), so the id is read live.
const eventId = computed(() => route.params.id as EventId)

const {
  events: { getItem }
} = useEvents()
const isLoading = ref(false)
const serverEvent = ref<ServerEvent<unknown> | null>(null)

const paramsType = computed(() => (route.params.type || undefined) as PageEventTypes | undefined)

// Determine the event type: from route params, or from the loaded event's type.
const resolvedType = computed(() => {
  if (paramsType.value) return paramsType.value
  if (isEventType(serverEvent.value?.type)) return serverEvent.value.type
  return undefined
})

const title = computed(
  () => (resolvedType.value ? PAGES_SETTINGS[resolvedType.value]?.title : '') || ''
)
// The type of /event/:id is known only after the event loads.
useTitle(computed(() => `${title.value || 'Event'} > ${eventId.value} | Buggregator`))

// A missing event and a failed load are different answers: the first is
// final (deleted, cleared, a wrong link), the second can be tried again.
const loadError = ref('')
const isMissing = ref(false)

const listPath = computed(() => {
  if (route.path.startsWith('/sentry/')) return '/sentry/exceptions'
  return paramsType.value ? `/${paramsType.value}` : '/'
})

const getEvent = async () => {
  const id = eventId.value
  isLoading.value = true
  loadError.value = ''
  isMissing.value = false

  try {
    const loaded = await getItem(id)
    // A newer id was asked for meanwhile: its answer wins.
    if (id !== eventId.value) return
    serverEvent.value = loaded
    isMissing.value = !serverEvent.value
  } catch (error) {
    logger(['UI: Failed to load event page', error])
    loadError.value = describeLoadError(error)
  } finally {
    isLoading.value = false
  }
}

// Another id: drop the old event, so its page does not show under the new title.
watch(
  eventId,
  (id, old) => {
    // Leaving for another page also changes the route: nothing to load then.
    if (!id) return
    if (old !== undefined) serverEvent.value = null
    getEvent()
  },
  { immediate: true }
)
</script>

<template>
  <LayoutBase
    class="events-list-page"
    :heading="`${title || 'Event'} event`"
  >
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageEventHeader
        :title="title"
        :event-id="eventId"
      />
    </template>

    <SkeletonLoader
      v-if="isLoading && !serverEvent"
      variant="event-detail"
    />

    <StatusPanel
      v-if="isMissing"
      title="Event not found"
      text="It was deleted or cleared, or the link is wrong."
      action-label="Back to the list"
      @action="router.push(listPath)"
    />

    <StatusPanel
      v-else-if="loadError"
      tone="error"
      title="Could not load the event"
      :text="loadError"
      action-label="Try again"
      @action="getEvent"
    />

    <EventPageMapper
      v-if="serverEvent"
      :event="serverEvent"
    />

    <!-- Room for the key hint bar, so it does not cover the page end. -->
    <div
      v-if="showHintBar"
      class="event-page__hint-room"
      aria-hidden="true"
    />
    <KeyHintBar bar="event-page" />
  </LayoutBase>
</template>

<style lang="scss" scoped>
.events-list-page {
  display: block;
}

.event-page__hint-room {
  @apply hidden md:block h-12 flex-none;
}
</style>
