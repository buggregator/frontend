<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar, PageEventHeader } from '@/widgets/ui'
import { EventPageMapper } from '@/widgets/ui/event-page-mapper'
import { PAGES_SETTINGS } from '@/shared/constants'
import { describeLoadError } from '@/shared/lib/io'
import { logger } from '@/shared/lib/logger'
import { useEvents } from '@/shared/lib/use-events'
import { type EventId, type PageEventTypes, type ServerEvent } from '@/shared/types'
import { SkeletonLoader } from '@/shared/ui/skeleton-loader'
import { StatusPanel } from '@/shared/ui/status-panel'

const route = useRoute()
const { params } = route
const router = useRouter()
const eventId = params.id as EventId

const {
  events: { getItem }
} = useEvents()
const isLoading = ref(false)
const serverEvent = ref<ServerEvent<unknown> | null>(null)

const paramsType = computed(() => (params?.type || undefined) as PageEventTypes | undefined)

// Determine the event type: from route params, or from the loaded event's type.
const resolvedType = computed(() => {
  if (paramsType.value) return paramsType.value
  if (serverEvent.value?.type) return serverEvent.value.type as PageEventTypes
  return undefined
})

const title = computed(
  () => (resolvedType.value ? PAGES_SETTINGS[resolvedType.value]?.title : '') || ''
)
// The type of /event/:id is known only after the event loads.
useTitle(computed(() => `${title.value || 'Event'} > ${eventId} | Buggregator`))

// A missing event and a failed load are different answers: the first is
// final (deleted, cleared, a wrong link), the second can be tried again.
const loadError = ref('')
const isMissing = ref(false)

const listPath = computed(() => {
  if (route.path.startsWith('/sentry/')) return '/sentry/exceptions'
  return paramsType.value ? `/${paramsType.value}` : '/'
})

const getEvent = async () => {
  isLoading.value = true
  loadError.value = ''
  isMissing.value = false

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<unknown> | null
    isMissing.value = !serverEvent.value
  } catch (error) {
    logger(['UI: Failed to load event page', error])
    loadError.value = describeLoadError(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(getEvent)
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
  </LayoutBase>
</template>

<style lang="scss" scoped>
.events-list-page {
  display: block;
}
</style>
