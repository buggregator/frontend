<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useEvents } from '@/shared/lib/use-events'
import { useSettingsStore } from '@/shared/stores'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { useMonologInlineDetails } from '../../lib'
import type { Monolog } from '../../types'
import { MonologBody } from '../monolog-body'

type Props = {
  event: NormalizedEvent<Monolog>
}

const props = defineProps<Props>()
const message = ref(props.event.payload.message)

const shortMessage = computed(() => {
  const lines = message.value.split('\n')

  if (lines.length > 10) {
    return `${lines.slice(0, 8).join('\n')}\n...`
  }

  return message.value
})

const isFullMessage = ref(message.value.length === shortMessage.value.length)

const toggleView = () => {
  isFullMessage.value = !isFullMessage.value
}

// Context and extra under the message, only with the setting on (frontend#283).
const { isMonologInlineContext } = storeToRefs(useSettingsStore())
const { events } = useEvents()
const { context, extra, isShown, isContextBig, isExtraBig } = useMonologInlineDetails(
  props.event.id,
  props.event.payload,
  isMonologInlineContext,
  (id) => events.getItem(id),
)
</script>

<template>
  <PreviewCard :event="event">
    <MonologBody
      :message="isFullMessage ? message : shortMessage"
      :message-clickable="!isFullMessage"
      :context="isShown ? context : null"
      :extra="isShown ? extra : null"
      :context-depth="isContextBig ? -1 : 1"
      :extra-depth="isExtraBig ? -1 : 1"
      @message-click="toggleView"
    />
  </PreviewCard>
</template>
