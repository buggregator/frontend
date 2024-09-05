<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageEventHeader } from '@/widgets/ui'
import { useSmtp } from '@/entities/smtp'
import type { SMTP } from '@/entities/smtp/types'
import { htmlEncode } from '@/shared/lib/helpers'
import { useEvents } from '@/shared/lib/use-events'
import type { Attachment, EventId, ServerEvent } from '@/shared/types'
import { SmtpPage } from '@/screens/smtp'

const { normalizeSmtpEvent } = useSmtp()

const { params } = useRoute()
const router = useRouter()
const eventId = params.id as EventId

useTitle(`SMTP > ${eventId} | Buggregator`)

const {
  events: { getItem }
} = useEvents()
const { getAttachments } = useSmtp()
const isLoading = ref(false)
const serverEvent = ref<ServerEvent<SMTP> | null>(null)
const attachments = ref<Attachment[]>([])

const event = computed(() =>
  serverEvent.value ? normalizeSmtpEvent(serverEvent.value as unknown as ServerEvent<SMTP>) : null
)

const html = computed(() =>
  serverEvent.value?.payload?.html
    ? `<iframe srcdoc="${htmlEncode(serverEvent.value?.payload?.html)}"/>`
    : undefined
)

const getEvent = async () => {
  isLoading.value = true

  try {
    serverEvent.value = (await getItem(eventId)) as unknown as ServerEvent<SMTP>
    isLoading.value = false

    if (!serverEvent.value) {
      throw new Error('Event not found')
    }

    await getAttachments(eventId).then((_attachments: Attachment[]) => {
      attachments.value = _attachments
    })
  } catch (error) {
    router.push('/404')
  }
}

onMounted(getEvent)
</script>

<template>
  <NuxtLayout>
    <template #header>
      <PageEventHeader title="Smtp" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="smtp-event__loading">
      <div />
      <div />
      <div />
    </div>

    <div>
      <SmtpPage v-if="event" :event="event" :attachments="attachments" :html-source="html" />
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.smtp-event {
}

.smtp-event__loading {
  @include loading;
}
</style>
