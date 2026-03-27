<script lang="ts" setup>
import { TableBase, TableBaseRow } from '@/shared/ui'
import type { SentryRequest } from '../../types'

type Props = {
  request: SentryRequest
}

defineProps<Props>()

const normalizeHeaderValue = (value: unknown) => (Array.isArray(value) ? value[0] || value : value)
</script>

<template>
  <section>
    <h3 class="section-title">
      Request
    </h3>

    <div
      v-if="request"
      class="request-url"
    >
      <span class="request-url__method">{{ request.method || 'GET' }}</span>
      <span class="request-url__path">{{ request.url }}</span>
    </div>

    <h4 class="section-subtitle">
      Headers
    </h4>

    <TableBase v-if="request && request.headers">
      <TableBaseRow
        v-for="(value, title) in request.headers"
        :key="title"
        :title="String(title)"
      >
        {{ normalizeHeaderValue(value) }}
      </TableBaseRow>
    </TableBase>
  </section>
</template>

<style lang="scss" scoped>
.section-title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400 mb-3;
}

.section-subtitle {
  @apply text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-400 dark:text-gray-500 mt-4 mb-2;
}

.request-url {
  @apply flex items-baseline gap-2 font-mono text-sm mb-4;
  @apply p-2.5 rounded;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
}

.request-url__method {
  @apply font-bold text-green-600 dark:text-green-400;
}

.request-url__path {
  @apply text-gray-700 dark:text-gray-200 break-all;
}
</style>
