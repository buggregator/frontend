<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar, PageEventHeader } from '@/widgets/ui'
import { EventPageMapper } from '@/widgets/ui/event-page-mapper'
import { PAGES_SETTINGS } from '@/shared/constants'
import { EventValidationError } from '@/shared/lib/errors'
import { logger } from '@/shared/lib/logger'
import { useEvents } from '@/shared/lib/use-events'
import { type EventId, type PageEventTypes, type ServerEvent, RouteName } from '@/shared/types'
import { SkeletonLoader } from '@/shared/ui/skeleton-loader'

const { params } = useRoute()
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
const pageName = title

useTitle(`${pageName.value} > ${eventId} | Buggregator`)

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<unknown>

    if (!serverEvent.value) {
      throw new EventValidationError('Event not found', eventId)
    }
  } catch (error) {
    logger(['UI: Failed to load event page', error])
    await router.replace({ name: RouteName.NotFound })
  } finally {
    isLoading.value = false
  }
}

onMounted(getEvent)
</script>

<template>
  <LayoutBase class="events-list-page">
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
