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
  <section class="sentry-page-request">
    <h3 class="sentry-page-request__title">request</h3>

    <div class="sentry-page-request__wrapper">
      <code v-if="request" class="sentry-page-request__url">
        <strong>{{ request.method || 'GET' }}:</strong>
        {{ request.url }}
      </code>

      <h3 class="sentry-page-request__title sentry-page-request__title--sub">headers</h3>

      <TableBase v-if="request && request.headers">
        <TableBaseRow v-for="(value, title) in request.headers" :key="title" :title="String(title)">
          {{ normalizeHeaderValue(value) }}
        </TableBaseRow>
      </TableBase>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.sentry-page-request {
}

.sentry-page-request__wrapper {
  @apply dark:bg-gray-900 bg-gray-100 p-3 rounded-md border border-purple-300 dark:border-gray-400;
}

.sentry-page-request__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.sentry-page-request__title--sub {
  @apply mt-7;
}

.sentry-page-request__url {
  @apply mb-1 text-lg font-medium;
}
</style>
