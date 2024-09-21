<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutBase, LayoutSidebar, PageEventHeader } from '@/widgets/ui'
import { EventPageMapper } from '@/widgets/ui/event-page-mapper'
import { PAGES_SETTINGS } from '@/shared/constants'
import { EventValidationError } from '@/shared/lib/errors/validation-errors'
import { useEvents } from '@/shared/lib/use-events'
import { type EventId, type PageEventTypes, type ServerEvent, RouteName } from '@/shared/types'

const { params } = useRoute()

const paramsType = computed(() => (params?.type || undefined) as PageEventTypes | undefined)
const pageName = computed(() => (paramsType?.value ? PAGES_SETTINGS[paramsType.value]?.title : ''))

const title = computed(() => (paramsType?.value ? PAGES_SETTINGS[paramsType.value]?.title : ''))

const router = useRouter()
const eventId = params.id as EventId

useTitle(`${pageName.value} > ${eventId} | Buggregator`)

const {
  events: { getItem }
} = useEvents()
const isLoading = ref(false)
const serverEvent = ref<ServerEvent<unknown> | null>(null)

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<unknown>
    isLoading.value = false

    if (!serverEvent.value) {
      new EventValidationError('Event not found', eventId)
    }
  } catch (error) {
    await router.push({ name: RouteName.NotFound })
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
      <PageEventHeader :title="title" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !serverEvent" class="events-list-page__loading">
      <div />
      <div />
      <div />
    </div>

    <EventPageMapper v-if="serverEvent" :event="serverEvent" />
  </LayoutBase>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.events-list-page {
  display: block;
}

.events-list-page__loading {
  @include loading;
  @include layout-body;
}
</style>
