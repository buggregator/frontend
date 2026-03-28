<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout } from '@/shared/ui'
import type { SmsPayload } from '../../types'

type Props = {
  event: NormalizedEvent<SmsPayload>
}

const props = defineProps<Props>()

const date = computed(() => moment(props.event.date).format('DD.MM.YYYY HH:mm:ss'))
const relativeDate = computed(() => moment(props.event.date).fromNow())

const GATEWAY_COLORS: Record<string, string> = {
  twilio: 'sms-page__badge--twilio',
  vonage: 'sms-page__badge--vonage',
  plivo: 'sms-page__badge--plivo',
  sinch: 'sms-page__badge--sinch',
  generic: 'sms-page__badge--generic'
}

const gatewayClass = computed(
  () => GATEWAY_COLORS[props.event.payload.gateway] || GATEWAY_COLORS.generic
)

const hasWarnings = computed(
  () => props.event.payload.warnings && props.event.payload.warnings.length > 0
)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div class="sms-page__header">
        <div class="sms-page__header-top">
          <h2 class="sms-page__title">
            SMS Message
          </h2>
          <span
            class="sms-page__badge"
            :class="gatewayClass"
          >{{ event.payload.gateway }}</span>
        </div>

        <div class="sms-page__meta">
          <span class="sms-page__flow">
            <span class="sms-page__from">{{ event.payload.from }}</span>
            <span class="sms-page__arrow">&rarr;</span>
            <span class="sms-page__to">{{ event.payload.to }}</span>
          </span>
          <span class="sms-page__date">
            {{ date }}
            <span class="sms-page__relative">({{ relativeDate }})</span>
          </span>
        </div>
      </div>
    </template>

    <!-- Warnings banner -->
    <div
      v-if="hasWarnings"
      class="sms-page__warnings"
    >
      <div class="sms-page__warnings-header">
        Validation Warnings
        <span class="sms-page__warnings-count">{{ event.payload.warnings?.length }}</span>
      </div>
      <div class="sms-page__warnings-list">
        <div
          v-for="w in event.payload.warnings"
          :key="w"
          class="sms-page__warning-item"
        >
          <span class="sms-page__warning-label">Missing field</span>
          <code class="sms-page__warning-field">{{ w }}</code>
        </div>
      </div>
    </div>

    <div class="sms-page__layout">
      <!-- Left: metadata -->
      <div class="sms-page__info">
        <section class="sms-card">
          <h3 class="sms-card__title">
            Details
          </h3>
          <div class="sms-info-rows">
            <div class="sms-info-row">
              <span class="sms-info-row__label">From</span>
              <span class="sms-info-row__value">{{ event.payload.from }}</span>
            </div>
            <div class="sms-info-row">
              <span class="sms-info-row__label">To</span>
              <span class="sms-info-row__value">{{ event.payload.to }}</span>
            </div>
            <div class="sms-info-row">
              <span class="sms-info-row__label">Gateway</span>
              <span class="sms-info-row__value">
                <span
                  class="sms-page__badge sms-page__badge--inline"
                  :class="gatewayClass"
                >{{
                  event.payload.gateway
                }}</span>
              </span>
            </div>
            <div class="sms-info-row">
              <span class="sms-info-row__label">Date</span>
              <span class="sms-info-row__value">{{ date }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Right: message body -->
      <div class="sms-page__content">
        <section class="sms-card">
          <h3 class="sms-card__title">
            Message
          </h3>
          <pre class="sms-page__message">{{ event.payload.message }}</pre>
        </section>
      </div>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Header */
.sms-page__header-top {
  @apply flex items-start justify-between gap-3 mb-2;
}

.sms-page__title {
  @apply text-base md:text-lg lg:text-xl font-semibold;
}

.sms-page__badge {
  @apply text-2xs font-mono font-semibold uppercase px-2 py-0.5 rounded;
}

.sms-page__badge--inline {
  @apply text-2xs;
}

.sms-page__badge--twilio {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.sms-page__badge--vonage {
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400;
}

.sms-page__badge--plivo {
  @apply bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400;
}

.sms-page__badge--sinch {
  @apply bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400;
}

.sms-page__badge--generic {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.sms-page__meta {
  @apply flex flex-wrap items-center gap-x-4 gap-y-1;
}

.sms-page__flow {
  @apply flex items-center gap-1.5 text-sm;
}

.sms-page__from {
  @apply font-medium;
}

.sms-page__arrow {
  @apply text-gray-400 dark:text-gray-500;
}

.sms-page__to {
  @apply text-gray-600 dark:text-gray-300;
}

.sms-page__date {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400;
}

.sms-page__relative {
  @apply text-gray-400 dark:text-gray-500;
}

/* Layout */
.sms-page__layout {
  @apply flex flex-col xl:flex-row gap-5;
}

.sms-page__info {
  @apply flex flex-col gap-4;
  @apply xl:w-[38%] xl:flex-shrink-0;
  @apply order-2 xl:order-1;
}

.sms-page__content {
  @apply flex-1 min-w-0;
  @apply order-1 xl:order-2;
}

/* Cards */
.sms-card {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.sms-card__title {
  @apply text-xs font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply px-4 py-2.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
}

/* Info rows */
.sms-info-rows {
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.sms-info-row {
  @apply flex items-start gap-3 px-4 py-2;
  @apply text-xs;
}

.sms-info-row__label {
  @apply font-medium text-gray-400 dark:text-gray-500;
  @apply w-24 flex-shrink-0;
}

.sms-info-row__value {
  @apply font-mono break-all;
}

/* Warnings */
.sms-page__warnings {
  @apply rounded-lg overflow-hidden mb-4;
  @apply border border-red-200 dark:border-red-800/50;
  @apply bg-red-50/50 dark:bg-red-950/20;
}

.sms-page__warnings-header {
  @apply text-xs font-semibold uppercase tracking-wider;
  @apply text-red-600 dark:text-red-400;
  @apply px-4 py-2.5;
  @apply bg-red-100/50 dark:bg-red-900/20;
  @apply border-b border-red-200 dark:border-red-800/50;
  @apply flex items-center gap-2;
}

.sms-page__warnings-count {
  @apply font-normal text-red-400 dark:text-red-500;
}

.sms-page__warnings-list {
  @apply divide-y divide-red-100 dark:divide-red-800/30;
}

.sms-page__warning-item {
  @apply flex items-center gap-3 px-4 py-2 text-xs;
}

.sms-page__warning-label {
  @apply text-red-500 dark:text-red-400 font-medium w-24 flex-shrink-0;
}

.sms-page__warning-field {
  @apply font-mono text-red-700 dark:text-red-300;
  @apply bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 rounded;
}

/* Message */
.sms-page__message {
  @apply text-sm font-mono p-4 whitespace-pre-wrap break-words;
  @apply text-gray-700 dark:text-gray-200;
  @apply bg-white dark:bg-gray-800;
  @apply min-h-[120px];
}
</style>
