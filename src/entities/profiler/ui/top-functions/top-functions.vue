<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { formatDuration } from '@/shared/lib/formats/format-duration'
import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import { type EventId } from '@/shared/types'
import { nextSort, sortFunctions, type TopFunctionsSort, useProfiler } from '../../lib'
import type { ProfilerTopFunctions } from '../../types'
import { StatBoard } from '../../ui'

type Props = {
  id: EventId
}

const { getTopFunctions } = useProfiler()
const props = defineProps<Props>()
const sort = ref<TopFunctionsSort>({ key: 'excl_wt', order: 'desc' })

const data = ref<ProfilerTopFunctions>({
  functions: [],
  overall_totals: {
    cpu: 0,
    wt: 0,
    mu: 0,
    pmu: 0,
    ct: 0
  },
  schema: []
})

// A click on the active column flips the order (frontend#280).
const toggleSort = (key: string) => {
  sort.value = nextSort(sort.value, key)
}

const ariaSort = (key: string) => {
  if (sort.value.key !== key) {
    return 'none'
  }

  return sort.value.order === 'asc' ? 'ascending' : 'descending'
}

const rows = computed(() => sortFunctions(data.value.functions, sort.value))

const formatValue = (value: number, format: string) => {
  if (format === 'ms') {
    return formatDuration(value)
  }

  if (format === 'percent') {
    return `${value}%`
  }

  if (format === 'number') {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value)
  }

  if (format === 'bytes') {
    return formatFileSize(value, 3)
  }

  return value
}

// The server returns the top rows by the metric, biggest first; `order` is for
// a server that can pick the lowest rows of the whole profile (#6695). Rows are
// sorted here too, so the order shown is right either way. Only the newest
// request lands: a fast double click must not show the older reply.
let requestSeq = 0
watchEffect(async () => {
  const seq = ++requestSeq
  const reply = await getTopFunctions(props.id, { metric: sort.value.key, order: sort.value.order })

  if (seq === requestSeq) {
    data.value = reply
  }
})
</script>

<template>
  <div class="top-fn">
    <!-- Stat board -->
    <div class="top-fn__stat">
      <StatBoard
        v-if="data.overall_totals"
        :cost="data.overall_totals"
      />
    </div>

    <!-- Table -->
    <div class="top-fn__table-wrap">
      <table class="top-fn__table">
        <thead>
          <tr>
            <th
              v-for="col in data.schema"
              :key="col.key"
              scope="col"
              class="top-fn__th"
              :class="{ 'top-fn__th--active': sort.key === col.key }"
              :title="col.description"
              :aria-sort="col.sortable ? ariaSort(col.key) : undefined"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="top-fn__sort"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <span
                  class="top-fn__sort-arrow"
                  :class="{ 'top-fn__sort-arrow--shown': sort.key === col.key }"
                  aria-hidden="true"
                >{{ sort.key === col.key && sort.order === 'asc' ? '▲' : '▼' }}</span>
              </button>
              <template v-else>
                {{ col.label }}
              </template>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in rows"
            :key="item.function"
            class="top-fn__row"
          >
            <td
              v-for="col in data.schema"
              :key="col.key"
              class="top-fn__td"
              :class="{
                'top-fn__td--active': sort.key === col.key,
                'top-fn__td--fn': col.key === 'function'
              }"
            >
              <div
                v-for="value in col.values"
                :key="value.key"
                :class="{
                  'top-fn__value': true,
                  'top-fn__value--sub': value.format === 'percent'
                }"
              >
                {{ formatValue(item[value.key], value.format) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top-fn {
  @apply flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden;
}

.top-fn__stat {
  @apply flex-shrink-0 border-b border-gray-200 dark:border-gray-700;
}

.top-fn__table-wrap {
  @apply flex-1 overflow-auto;
}

.top-fn__table {
  @apply w-full text-xs;
}

/* Header */
thead {
  @apply backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-600/50;
}

.top-fn__th {
  @apply px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap;
}

.top-fn__sort {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.top-fn__sort:hover {
  text-decoration: underline;
}

.top-fn__sort:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.top-fn__sort-arrow {
  font-size: 9px;
  visibility: hidden;
}

.top-fn__sort-arrow--shown {
  visibility: visible;
}

.top-fn__th--active {
  @apply text-gray-800 dark:text-gray-100 border-x border-gray-300 dark:border-gray-600 bg-gray-200/50 dark:bg-gray-800/50;
}

/* Rows */
.top-fn__row {
  @apply hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors;

  &:nth-child(odd) {
    @apply bg-gray-100 dark:bg-gray-700;
  }

  &:nth-child(even) {
    @apply bg-white dark:bg-gray-800;
  }
}

.top-fn__td {
  @apply px-4 py-1.5 text-left;
}

.top-fn__td--active {
  @apply border-x border-gray-200 dark:border-gray-600 bg-gray-100/30 dark:bg-gray-700/20;
}

.top-fn__td--fn {
  @apply font-medium text-gray-800 dark:text-gray-200 max-w-[400px] truncate;
}

/* Values */
.top-fn__value {
  @apply text-gray-700 dark:text-gray-300;
}

.top-fn__value--sub {
  @apply text-[10px] text-gray-500 dark:text-gray-400;
}
</style>
