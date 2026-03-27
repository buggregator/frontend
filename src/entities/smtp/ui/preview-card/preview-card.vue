<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { SMTP } from '../../types'

type Props = {
  event: NormalizedEvent<SMTP>
}

const props = defineProps<Props>()
const eventLink = computed(() => `/smtp/${props.event.id}`)

const emailFrom = computed(() => {
  const from = props.event?.payload?.from?.[0]
  if (!from) return null
  return from.name ? `${from.name} <${from.email}>` : from.email
})

const emailTo = computed(() => {
  const to = props.event?.payload?.to?.[0]
  if (!to) return null
  return to.name ? `${to.name} <${to.email}>` : to.email
})

const textPreview = computed(() => {
  const text = props.event?.payload?.text || ''
  if (!text) return null
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return trimmed.length > 120 ? `${trimmed.substring(0, 120)}...` : trimmed
})

const hasHtml = computed(() => !!props.event?.payload?.html)
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="smtp-body"
    >
      <div class="smtp-body__header">
        <h3 class="smtp-body__subject">
          {{ event.payload.subject }}
        </h3>
        <span
          v-if="hasHtml"
          class="smtp-body__badge"
        >HTML</span>
      </div>

      <div class="smtp-body__addresses">
        <span
          v-if="emailFrom"
          class="smtp-body__addr"
        >
          <span class="smtp-body__addr-label">From</span>
          {{ emailFrom }}
        </span>
        <span
          v-if="emailTo"
          class="smtp-body__addr"
        >
          <span class="smtp-body__addr-label">To</span>
          {{ emailTo }}
        </span>
      </div>

      <p
        v-if="textPreview"
        class="smtp-body__preview"
      >
        {{ textPreview }}
      </p>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.smtp-body {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.smtp-body__header {
  @apply flex items-start justify-between gap-2 mb-1.5;
}

.smtp-body__subject {
  @apply font-medium text-sm;
}

.smtp-body__badge {
  @apply text-2xs font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0;
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400;
}

.smtp-body__addresses {
  @apply flex flex-wrap gap-x-4 gap-y-0.5 text-xs mb-1.5;
}

.smtp-body__addr {
  @apply text-gray-600 dark:text-gray-300 font-mono;
}

.smtp-body__addr-label {
  @apply text-gray-400 dark:text-gray-500 font-sans mr-1;
}

.smtp-body__preview {
  @apply text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2;
}
</style>
