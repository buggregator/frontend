<script lang="ts" setup>
import moment from 'moment'
import { ref, computed, nextTick, watch } from 'vue'
import { CodeSnippet } from '@/shared/ui'
import type { SentryBreadcrumb } from '../../types'

type Props = {
  breadcrumbs: SentryBreadcrumb[]
}

const props = withDefaults(defineProps<Props>(), {
  breadcrumbs: () => [] as SentryBreadcrumb[]
})

const selectedIndex = ref<number | null>(null)

const hasPrev = computed(() => selectedIndex.value !== null && selectedIndex.value > 0)
const hasNext = computed(
  () => selectedIndex.value !== null && selectedIndex.value < props.breadcrumbs.length - 1
)

function select(index: number) {
  selectedIndex.value = selectedIndex.value === index ? null : index
}

function prev() {
  if (hasPrev.value) {
    selectedIndex.value = selectedIndex.value! - 1
    scrollToSelected()
  }
}

function next() {
  if (hasNext.value) {
    selectedIndex.value = selectedIndex.value! + 1
    scrollToSelected()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (selectedIndex.value === null) return

  if (e.key === 'ArrowUp' || e.key === 'k') {
    e.preventDefault()
    prev()
  } else if (e.key === 'ArrowDown' || e.key === 'j') {
    e.preventDefault()
    next()
  } else if (e.key === 'Escape') {
    selectedIndex.value = null
  }
}

function scrollToSelected() {
  nextTick(() => {
    const el = document.querySelector('.breadcrumbs__row--selected')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

watch(
  () => props.breadcrumbs,
  () => {
    selectedIndex.value = null
  }
)

const formatDate = (timestamp?: number): string =>
  timestamp ? moment.unix(timestamp).fromNow() : ''
</script>

<template>
  <section
    class="breadcrumbs"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="breadcrumbs__title-row">
      <h3 class="breadcrumbs__title">
        Breadcrumbs
        <span class="breadcrumbs__count">{{ breadcrumbs.length }}</span>
      </h3>

      <div
        v-if="selectedIndex !== null"
        class="breadcrumbs__nav"
      >
        <span class="breadcrumbs__nav-position">
          {{ selectedIndex + 1 }} / {{ breadcrumbs.length }}
        </span>
        <button
          class="breadcrumbs__nav-btn"
          :disabled="!hasPrev"
          title="Previous (↑)"
          @click="prev"
        >
          &#x25B2;
        </button>
        <button
          class="breadcrumbs__nav-btn"
          :disabled="!hasNext"
          title="Next (↓)"
          @click="next"
        >
          &#x25BC;
        </button>
      </div>
    </div>

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
          :class="{ 'breadcrumbs__row--selected': selectedIndex === i }"
          @click="select(i)"
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
.breadcrumbs {
  @apply outline-none;
}

.breadcrumbs__title-row {
  @apply flex items-center justify-between mb-3;
}

.breadcrumbs__title {
  @apply text-xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply flex items-center gap-2;
}

.breadcrumbs__count {
  @apply text-2xs px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.breadcrumbs__nav {
  @apply flex items-center gap-1.5;
}

.breadcrumbs__nav-position {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 mr-1;
}

.breadcrumbs__nav-btn {
  @apply w-6 h-6 flex items-center justify-center rounded text-2xs;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700;
  @apply disabled:opacity-30 disabled:cursor-not-allowed;
  @apply transition-colors;
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
  @apply flex text-xs cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;
}

.breadcrumbs__row--selected {
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply border-l-2 border-l-blue-500;
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
