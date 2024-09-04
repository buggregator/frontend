<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#app' // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from '@/widgets/ui'
import { useRay } from '@/entities/ray'
import type { RayDump } from '@/entities/ray/types'
import { useEvents } from '@/shared/lib/use-events'
import type { EventId, ServerEvent } from '@/shared/types'
import { RayPage } from '@/screens/ray'

const { normalizeRayEvent } = useRay()

const { params } = useRoute()
const router = useRouter()
const eventId = params.id as EventId

useTitle(`Ray Dumo > ${eventId} | Buggregator`)

const {
  events: { getItem }
} = useEvents()

const isLoading = ref(false)
const serverEvent = ref<ServerEvent<RayDump> | null>(null)

const event = computed(() => (serverEvent.value ? normalizeRayEvent(serverEvent.value) : null))

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<RayDump>
    isLoading.value = false

    if (!serverEvent.value) {
      throw new Error('Event not found')
    }
  } catch (error) {
    router.push('/404')
  }
}

onMounted(getEvent)
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageEventHeader title="Ray Dump" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="ray-dump__loading">
      <div />
      <div />
      <div />
    </div>

    <div v-if="event">
      <RayPage :event="event" />
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.ray-dump {
}

.ray-dump__loading {
  @include loading;
}
</style>
