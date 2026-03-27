<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useProfiler } from '../../lib'
import type { ProfilerComparisonFunction } from '../../types'

type Props = {
  baseId: string
  compareId: string
}

const props = defineProps<Props>()
const { compareProfiles } = useProfiler()

const functions = ref<ProfilerComparisonFunction[]>([])
const loading = ref(true)

const formatMs = (us: number) => `${(us / 1000).toFixed(1)}ms`
const formatBytes = (bytes: number) => {
  if (Math.abs(bytes) < 1024) return `${bytes}B`
  if (Math.abs(bytes) < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const diffClass = (val: number) => {
  if (val > 0) return 'profile-compare__diff--slower'
  if (val < 0) return 'profile-compare__diff--faster'
  return ''
}

const diffSign = (val: number) => (val > 0 ? '+' : '')

onMounted(async () => {
  try {
    const result = await compareProfiles(props.baseId, props.compareId)
    functions.value = result.functions
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="profile-compare">
    <div class="profile-compare__legend">
      <span class="profile-compare__legend-item">
        Base
        <RouterLink
          :to="`/profiler/${baseId}`"
          class="profile-compare__legend-link"
          target="_blank"
        >
          {{ baseId.substring(0, 8) }}
        </RouterLink>
      </span>
      <span class="profile-compare__legend-vs">vs</span>
      <span class="profile-compare__legend-item">
        Compare
        <RouterLink
          :to="`/profiler/${compareId}`"
          class="profile-compare__legend-link"
          target="_blank"
        >
          {{ compareId.substring(0, 8) }}
        </RouterLink>
      </span>
    </div>

    <div
      v-if="loading"
      class="profile-compare__loading"
    >
      Loading comparison...
    </div>

    <table
      v-else-if="functions.length"
      class="profile-compare__table"
    >
      <thead>
        <tr>
          <th class="profile-compare__th">
            Function
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Wall Time (excl.)
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Diff
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Memory (excl.)
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Diff
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Calls
          </th>
          <th class="profile-compare__th profile-compare__th--num">
            Diff
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="fn in functions"
          :key="fn.function"
          class="profile-compare__row"
        >
          <td class="profile-compare__td profile-compare__fn">
            {{ fn.function }}
          </td>
          <td class="profile-compare__td profile-compare__td--num">
            {{ formatMs(Number(fn.base_excl_wt)) }} / {{ formatMs(Number(fn.compare_excl_wt)) }}
          </td>
          <td
            class="profile-compare__td profile-compare__td--num profile-compare__diff"
            :class="diffClass(Number(fn.diff_excl_wt))"
          >
            {{ diffSign(Number(fn.diff_excl_wt)) }}{{ formatMs(Number(fn.diff_excl_wt)) }}
          </td>
          <td class="profile-compare__td profile-compare__td--num">
            {{ formatBytes(Number(fn.base_excl_mu)) }} /
            {{ formatBytes(Number(fn.compare_excl_mu)) }}
          </td>
          <td
            class="profile-compare__td profile-compare__td--num profile-compare__diff"
            :class="diffClass(Number(fn.diff_excl_mu))"
          >
            {{ diffSign(Number(fn.diff_excl_mu)) }}{{ formatBytes(Number(fn.diff_excl_mu)) }}
          </td>
          <td class="profile-compare__td profile-compare__td--num">
            {{ fn.base_ct }} / {{ fn.compare_ct }}
          </td>
          <td
            class="profile-compare__td profile-compare__td--num profile-compare__diff"
            :class="diffClass(Number(fn.diff_ct))"
          >
            {{ diffSign(Number(fn.diff_ct)) }}{{ fn.diff_ct }}
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-else
      class="profile-compare__empty"
    >
      No data to compare.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-compare {
  @apply p-4 overflow-auto h-full;
}

.profile-compare__legend {
  @apply flex items-center gap-3 pb-3 mb-3;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.profile-compare__legend-item {
  @apply flex items-center gap-1.5;
}

.profile-compare__legend-link {
  @apply font-mono text-2xs px-1 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-blue-600 dark:text-blue-400;
  @apply hover:bg-blue-50 dark:hover:bg-blue-500/10;
  @apply hover:underline;
  @apply transition-colors;
}

.profile-compare__legend-vs {
  @apply text-gray-300 dark:text-gray-600 text-2xs;
}

.profile-compare__loading,
.profile-compare__empty {
  @apply text-sm text-gray-500 dark:text-gray-400 text-center py-8;
}

.profile-compare__table {
  @apply w-full text-xs;
  @apply border-collapse;
}

.profile-compare__th {
  @apply text-left px-2 py-1.5 font-semibold text-2xs uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply sticky top-0 bg-white dark:bg-gray-900;
}

.profile-compare__th--num {
  @apply text-right;
}

.profile-compare__row {
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50;
}

.profile-compare__td {
  @apply px-2 py-1 border-b border-gray-100 dark:border-gray-800;
  @apply text-gray-700 dark:text-gray-300;
}

.profile-compare__td--num {
  @apply text-right font-mono tabular-nums;
}

.profile-compare__fn {
  @apply font-mono truncate max-w-xs;
}

.profile-compare__diff--faster {
  @apply text-green-600 dark:text-green-400;
}

.profile-compare__diff--slower {
  @apply text-red-600 dark:text-red-400;
}
</style>
