<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { TableBase, TableBaseRow, EventDetailLayout, EventDetailSection } from '@/shared/ui'
import type { Inspector, InspectorTransaction } from '../../types'
import { InspectorPageTimeline } from '../inspector-page-timeline'

type Props = {
  event: NormalizedEvent<Inspector>
}

const props = defineProps<Props>()

const transaction = computed(() => props.event?.payload[0] as InspectorTransaction)

const http = computed(() => transaction.value?.http)
const host = computed(() => transaction.value?.host)

const method = computed(() => http.value?.request?.method || 'GET')
const fullUrl = computed(() => http.value?.url?.full || http.value?.url?.path || '')

const methodColor = computed(() => {
  const m = method.value?.toUpperCase()
  if (m === 'GET') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
  if (m === 'POST') return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
  if (m === 'PUT' || m === 'PATCH')
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
  if (m === 'DELETE') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10'
})

const resultColor = computed(() => {
  const r = (transaction.value?.result || 'success').toLowerCase()
  if (r === 'success' || r === '200') return 'text-green-600 dark:text-green-400'
  if (r.startsWith('4') || r === 'error') return 'text-red-600 dark:text-red-400'
  if (r.startsWith('5')) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-300'
})
</script>

<template>
  <EventDetailLayout
    :title="transaction.name"
    :date="event.date"
  >
    <!-- Summary boxes -->
    <EventDetailSection>
      <div class="insp-boxes">
        <div class="insp-box">
          <span class="insp-box__label">Duration</span>
          <span class="insp-box__value">{{ transaction.duration }} ms</span>
        </div>
        <div class="insp-box">
          <span class="insp-box__label">Result</span>
          <span
            class="insp-box__value"
            :class="resultColor"
          >{{
            (transaction.result || 'success').toUpperCase()
          }}</span>
        </div>
        <div
          v-if="transaction.memory_peak"
          class="insp-box"
        >
          <span class="insp-box__label">Memory Peak</span>
          <span class="insp-box__value">{{ (transaction.memory_peak / 1024 / 1024).toFixed(2) }} MB</span>
        </div>
        <div class="insp-box">
          <span class="insp-box__label">Type</span>
          <span class="insp-box__value">{{ transaction.type }}</span>
        </div>
      </div>
    </EventDetailSection>

    <!-- Request URL -->
    <EventDetailSection v-if="http">
      <div class="insp-request">
        <span
          class="insp-request__method"
          :class="methodColor"
        >{{ method }}</span>
        <span class="insp-request__url">{{ fullUrl }}</span>
      </div>
    </EventDetailSection>

    <!-- Timeline -->
    <EventDetailSection>
      <InspectorPageTimeline :payload="event.payload" />
    </EventDetailSection>

    <!-- Host -->
    <EventDetailSection
      v-if="host"
      title="Host"
    >
      <div class="insp-boxes">
        <div
          v-if="host.hostname"
          class="insp-box"
        >
          <span class="insp-box__label">Hostname</span>
          <span class="insp-box__value">{{ host.hostname }}</span>
        </div>
        <div
          v-if="host.ip"
          class="insp-box"
        >
          <span class="insp-box__label">IP</span>
          <span class="insp-box__value">{{ host.ip }}</span>
        </div>
        <div
          v-if="host.os"
          class="insp-box"
        >
          <span class="insp-box__label">OS</span>
          <span class="insp-box__value">{{ host.os }}</span>
        </div>
      </div>
    </EventDetailSection>

    <!-- Headers -->
    <EventDetailSection
      v-if="http?.request?.headers"
      title="Headers"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in http.request.headers"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- URL Details -->
    <EventDetailSection
      v-if="http?.url"
      title="URL Details"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in http.url"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>

    <!-- Cookies -->
    <EventDetailSection
      v-if="http?.request?.cookies && Object.keys(http.request.cookies).length"
      title="Cookies"
    >
      <TableBase>
        <TableBaseRow
          v-for="(value, name) in http.request.cookies"
          :key="name"
          :title="String(name)"
        >
          {{ value }}
        </TableBaseRow>
      </TableBase>
    </EventDetailSection>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.insp-boxes {
  @apply flex flex-col sm:flex-row flex-wrap gap-2;
}

.insp-box {
  @apply flex flex-col flex-1 p-3 rounded min-w-0;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.insp-box__label {
  @apply text-2xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.insp-box__value {
  @apply text-sm font-mono mt-1;
}

.insp-request {
  @apply flex items-baseline gap-3 font-mono text-sm;
  @apply p-3 rounded;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.insp-request__method {
  @apply font-bold text-xs px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0;
}

.insp-request__url {
  @apply text-gray-700 dark:text-gray-200 break-all;
}
</style>
