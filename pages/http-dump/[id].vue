<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#app' // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from '@/widgets/ui'
import { useHttpDump } from '@/entities/http-dump'
import type { HttpDumpServer } from '@/entities/http-dump/types'
import { useEvents } from '@/shared/lib/use-events'
import type { EventId, ServerEvent } from '@/shared/types'
import { HttpDumpPage } from '@/screens/http-dump'

const { normalizeHttpDumpEvent } = useHttpDump()

const { params } = useRoute()
const router = useRouter()
const eventId = params.id as EventId

useTitle(`Http dumps > ${eventId} | Buggregator`)

const {
  events: { getItem }
} = useEvents()

const isLoading = ref(false)
const serverEvent = ref<ServerEvent<HttpDumpServer> | null>(null)

const event = computed(() => (serverEvent.value ? normalizeHttpDumpEvent(serverEvent.value) : null))

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<HttpDumpServer>
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
      <PageEventHeader title="Http dumps" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="http-dump-event__loading">
      <div />
      <div />
      <div />
    </div>

    <HttpDumpPage v-if="event" :event="event" />
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';
.http-dump-event {
}

.http-dump-event__loading {
  @include loading;
}
</style>
