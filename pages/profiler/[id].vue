<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#app' // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from '@/widgets/ui'
import { useProfiler } from '@/entities/profiler'
import type { Profiler } from '@/entities/profiler/types'
import { useEvents } from '@/shared/lib/use-events'
import type { EventId, ServerEvent } from '@/shared/types'
import { ProfilerPage } from '@/screens/profiler'

const { normalizeProfilerEvent } = useProfiler()

const { params } = useRoute()
const router = useRouter()
const eventId = params.id as EventId

useTitle(`Profiler > ${eventId} | Buggregator`)

const {
  events: { getItem }
} = useEvents()

const isLoading = ref(false)
const serverEvent = ref<ServerEvent<Profiler> | null>(null)

const event = computed(() => (serverEvent.value ? normalizeProfilerEvent(serverEvent.value) : null))

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<Profiler>
    isLoading.value = false

    if (!serverEvent.value) {
      router.push('/404')
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
      <PageEventHeader title="Profiler" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="profiler-event__loading">
      <div />
      <div />
      <div />
    </div>

    <ProfilerPage v-if="event" :event="event" class="p-5" />
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.profiler-event {
  @include layout;
}

.profiler-event__head {
  @include layout-head;
}

.profiler-event__loading {
  @include loading;
  @include layout-body;
}
</style>
