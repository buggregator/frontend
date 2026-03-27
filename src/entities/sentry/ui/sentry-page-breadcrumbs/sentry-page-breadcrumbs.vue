<script lang="ts" setup>
import moment from 'moment'
import { CodeSnippet } from '@/shared/ui'
import type { SentryBreadcrumb } from '../../types'

type Props = {
  breadcrumbs: SentryBreadcrumb[]
}

withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [] as SentryBreadcrumb[]
})

const formatDate = (timestamp?: number): string =>
  timestamp ? moment.unix(timestamp).fromNow() : ''
</script>

<template>
  <section class="breadcrumbs">
    <h3 class="breadcrumbs__title">
      Breadcrumbs
      <span class="breadcrumbs__count">{{ breadcrumbs.length }}</span>
    </h3>

    <div class="breadcrumbs__table">
      <!-- Header -->
      <div class="breadcrumbs__header">
        <span class="breadcrumbs__header-cell breadcrumbs__header-cell--desc">Description</span>
        <span class="breadcrumbs__header-cell breadcrumbs__header-cell--level">Level</span>
        <span class="breadcrumbs__header-cell breadcrumbs__header-cell--time">Time</span>
      </div>

      <!-- Rows -->
      <div class="breadcrumbs__body">
        <div
          v-for="(b, i) in breadcrumbs"
          :key="i"
          class="breadcrumbs__row"
        >
          <div class="breadcrumbs__cell breadcrumbs__cell--desc">
            <p
              v-if="b.message"
              class="breadcrumbs__message"
            >
              {{ b.message }}
            </p>

            <CodeSnippet
              v-if="b.data"
              class="breadcrumbs__data"
              language="json"
              :code="b.data"
            />

            <div
              v-if="b.type || b.category"
              class="breadcrumbs__details"
            >
              <span
                v-if="b.type"
                class="breadcrumbs__detail"
              >
                <span class="breadcrumbs__detail-key">type</span>
                <span class="breadcrumbs__detail-val">{{ b.type }}</span>
              </span>
              <span
                v-if="b.category"
                class="breadcrumbs__detail"
              >
                <span class="breadcrumbs__detail-key">category</span>
                <span class="breadcrumbs__detail-val">{{ b.category }}</span>
              </span>
            </div>
          </div>

          <div class="breadcrumbs__cell breadcrumbs__cell--level">
            <span
              v-if="b.level"
              class="breadcrumbs__level"
              :class="`breadcrumbs__level--${b.level.toLowerCase()}`"
            >{{ b.level }}</span>
          </div>

          <div class="breadcrumbs__cell breadcrumbs__cell--time">
            {{ formatDate(b.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.breadcrumbs__title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply flex items-center gap-2 mb-3;
}

.breadcrumbs__count {
  @apply text-2xs px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.breadcrumbs__table {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  max-height: 600px;
  @apply flex flex-col;
}

/* Header */
.breadcrumbs__header {
  @apply flex text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply flex-shrink-0;
}

.breadcrumbs__header-cell {
  @apply px-3 py-2;
}

.breadcrumbs__header-cell--desc {
  @apply flex-1;
}

.breadcrumbs__header-cell--level {
  @apply w-24;
}

.breadcrumbs__header-cell--time {
  @apply w-32;
}

/* Body */
.breadcrumbs__body {
  @apply overflow-y-auto flex-1;
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.breadcrumbs__row {
  @apply flex text-xs;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.breadcrumbs__cell {
  @apply px-3 py-2;
}

.breadcrumbs__cell--desc {
  @apply flex-1 min-w-0;
}

.breadcrumbs__cell--level {
  @apply w-24 flex-shrink-0;
}

.breadcrumbs__cell--time {
  @apply w-32 flex-shrink-0 font-mono text-gray-400 dark:text-gray-500;
}

.breadcrumbs__message {
  @apply font-medium;
}

.breadcrumbs__data {
  @apply mt-1.5 rounded overflow-hidden;
}

.breadcrumbs__details {
  @apply flex flex-wrap gap-1 mt-1.5;
}

.breadcrumbs__detail {
  @apply inline-flex items-center text-2xs rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.breadcrumbs__detail-key {
  @apply px-1.5 py-0.5 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800;
}

.breadcrumbs__detail-val {
  @apply px-1.5 py-0.5 font-mono;
}

/* Level badges */
.breadcrumbs__level {
  @apply uppercase text-2xs font-semibold px-1.5 py-0.5 rounded;
}

.breadcrumbs__level--debug {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.breadcrumbs__level--info {
  @apply bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400;
}

.breadcrumbs__level--warning {
  @apply bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400;
}

.breadcrumbs__level--error {
  @apply bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400;
}
</style>
