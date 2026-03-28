<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { SmsPayload } from '../../types'

type Props = {
  event: NormalizedEvent<SmsPayload>
}

const props = defineProps<Props>()

const eventLink = computed(() => `/sms/${props.event.id}`)

const textPreview = computed(() => {
  const t = props.event.payload.message || ''
  const trimmed = t.replace(/\s+/g, ' ').trim()
  return trimmed.length > 120 ? `${trimmed.substring(0, 120)}...` : trimmed
})

const GATEWAY_COLORS: Record<string, string> = {
  twilio: 'sms-body__badge--twilio',
  vonage: 'sms-body__badge--vonage',
  plivo: 'sms-body__badge--plivo',
  sinch: 'sms-body__badge--sinch',
  generic: 'sms-body__badge--generic'
}

const gatewayClass = computed(
  () => GATEWAY_COLORS[props.event.payload.gateway] || GATEWAY_COLORS.generic
)

const hasWarnings = computed(
  () => props.event.payload.warnings && props.event.payload.warnings.length > 0
)
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="sms-body"
    >
      <div class="sms-body__header">
        <div class="sms-body__flow">
          <span
            v-if="event.payload.from"
            class="sms-body__pill"
          >{{ event.payload.from }}</span>

          <svg
            v-if="event.payload.from && event.payload.to"
            class="sms-body__arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
            />
            <polyline points="12 5 19 12 12 19" />
          </svg>

          <span
            v-if="event.payload.to"
            class="sms-body__pill"
          >{{ event.payload.to }}</span>
        </div>

        <div class="sms-body__badges">
          <span
            v-if="hasWarnings"
            class="sms-body__badge sms-body__badge--warning"
            :title="event.payload.warnings?.join(', ')"
          >{{ event.payload.warnings?.length }} warning{{
            event.payload.warnings && event.payload.warnings.length > 1 ? 's' : ''
          }}</span>
          <span
            v-if="event.payload.gateway"
            class="sms-body__badge"
            :class="gatewayClass"
          >{{
            event.payload.gateway
          }}</span>
        </div>
      </div>

      <p
        v-if="textPreview"
        class="sms-body__preview"
      >
        {{ textPreview }}
      </p>

      <div
        v-if="hasWarnings"
        class="sms-body__warnings"
      >
        <span
          v-for="w in event.payload.warnings"
          :key="w"
          class="sms-body__warning-item"
        >Missing: {{ w }}</span>
      </div>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.sms-body {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.sms-body__header {
  @apply flex items-start justify-between gap-2 mb-1.5;
}

.sms-body__flow {
  @apply flex items-center gap-1.5 text-xs flex-wrap;
}

.sms-body__pill {
  @apply inline-flex items-center px-2 py-0.5 rounded-full;
  @apply font-mono text-2xs;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
}

.sms-body__arrow {
  @apply w-3.5 h-3.5 flex-shrink-0;
  @apply text-gray-300 dark:text-gray-600;
}

.sms-body__badge {
  @apply text-2xs font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0;
}

.sms-body__badge--twilio {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.sms-body__badge--vonage {
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400;
}

.sms-body__badge--plivo {
  @apply bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400;
}

.sms-body__badge--sinch {
  @apply bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400;
}

.sms-body__badge--generic {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.sms-body__badges {
  @apply flex gap-1.5 flex-shrink-0;
}

.sms-body__badge--warning {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.sms-body__preview {
  @apply text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2;
}

.sms-body__warnings {
  @apply flex flex-wrap gap-1 mt-1.5;
}

.sms-body__warning-item {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-mono;
  @apply bg-red-50 dark:bg-red-500/10;
  @apply text-red-600 dark:text-red-400;
}
</style>
