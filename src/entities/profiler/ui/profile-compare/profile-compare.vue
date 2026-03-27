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

const formatMs = (us: number) => {
  const ms = us / 1000
  if (Math.abs(ms) < 0.1) return `${us}\u00B5s`
  if (Math.abs(ms) < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatBytes = (bytes: number) => {
  if (Math.abs(bytes) < 1024) return `${bytes}B`
  if (Math.abs(bytes) < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const diffClass = (val: number) => {
  if (val > 0) return 'pc__slower'
  if (val < 0) return 'pc__faster'
  return ''
}

const diffSign = (val: number) => (val > 0 ? '+' : '')

const diffPct = (base: number, compare: number) => {
  if (base === 0) return compare === 0 ? '' : 'new'
  const pct = ((compare - base) / base) * 100
  if (Math.abs(pct) < 0.1) return ''
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

onMounted(async () => {
  try {
    const result = await compareProfiles(props.baseId, props.compareId)
    functions.value = result.functions
  } catch {
    // silently degrade
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pc">
    <!-- Legend bar -->
    <div class="pc__legend">
      <span class="pc__legend-item">
        <span class="pc__legend-dot pc__legend-dot--base" />
        Base
        <a
          :href="`/profiler/${baseId}`"
          target="_blank"
          class="pc__legend-link"
        >
          {{ baseId.substring(0, 8) }}
        </a>
      </span>
      <span class="pc__legend-vs">vs</span>
      <span class="pc__legend-item">
        <span class="pc__legend-dot pc__legend-dot--compare" />
        Compare
        <a
          :href="`/profiler/${compareId}`"
          target="_blank"
          class="pc__legend-link"
        >
          {{ compareId.substring(0, 8) }}
        </a>
      </span>
      <span class="pc__legend-hint">
        <span class="pc__faster">green = faster / less</span>
        <span class="pc__legend-sep">&middot;</span>
        <span class="pc__slower">red = slower / more</span>
      </span>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="pc__status"
    >
      Loading comparison...
    </div>

    <!-- Scrollable table -->
    <div
      v-else-if="functions.length"
      class="pc__scroll"
    >
      <table class="pc__table">
        <thead>
          <tr>
            <th class="pc__th pc__th--fn">
              Function
            </th>
            <th class="pc__th pc__th--num">
              Wall Time
            </th>
            <th class="pc__th pc__th--num pc__th--change">
              Change
            </th>
            <th class="pc__th pc__th--num">
              Memory
            </th>
            <th class="pc__th pc__th--num pc__th--change">
              Change
            </th>
            <th class="pc__th pc__th--num">
              Calls
            </th>
            <th class="pc__th pc__th--num pc__th--change">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in functions"
            :key="fn.function"
            class="pc__row"
          >
            <td class="pc__td pc__td--fn">
              {{ fn.function }}
            </td>

            <!-- Wall Time -->
            <td class="pc__td pc__td--num">
              <span class="pc__val-base">{{ formatMs(Number(fn.base_excl_wt)) }}</span>
              <span class="pc__arrow">&rarr;</span>
              <span
                class="pc__val-compare"
                :class="diffClass(Number(fn.diff_excl_wt))"
              >{{
                formatMs(Number(fn.compare_excl_wt))
              }}</span>
            </td>
            <td
              class="pc__td pc__td--num pc__td--change"
              :class="diffClass(Number(fn.diff_excl_wt))"
            >
              <span class="pc__change-abs">{{ diffSign(Number(fn.diff_excl_wt))
              }}{{ formatMs(Number(fn.diff_excl_wt)) }}</span>
              <span class="pc__change-pct">{{
                diffPct(Number(fn.base_excl_wt), Number(fn.compare_excl_wt))
              }}</span>
            </td>

            <!-- Memory -->
            <td class="pc__td pc__td--num">
              <span class="pc__val-base">{{ formatBytes(Number(fn.base_excl_mu)) }}</span>
              <span class="pc__arrow">&rarr;</span>
              <span
                class="pc__val-compare"
                :class="diffClass(Number(fn.diff_excl_mu))"
              >{{
                formatBytes(Number(fn.compare_excl_mu))
              }}</span>
            </td>
            <td
              class="pc__td pc__td--num pc__td--change"
              :class="diffClass(Number(fn.diff_excl_mu))"
            >
              <span class="pc__change-abs">{{ diffSign(Number(fn.diff_excl_mu))
              }}{{ formatBytes(Number(fn.diff_excl_mu)) }}</span>
              <span class="pc__change-pct">{{
                diffPct(Number(fn.base_excl_mu), Number(fn.compare_excl_mu))
              }}</span>
            </td>

            <!-- Calls -->
            <td class="pc__td pc__td--num">
              <span class="pc__val-base">{{ fn.base_ct }}</span>
              <span class="pc__arrow">&rarr;</span>
              <span
                class="pc__val-compare"
                :class="diffClass(Number(fn.diff_ct))"
              >{{
                fn.compare_ct
              }}</span>
            </td>
            <td
              class="pc__td pc__td--num pc__td--change"
              :class="diffClass(Number(fn.diff_ct))"
            >
              <span class="pc__change-abs">{{ diffSign(Number(fn.diff_ct)) }}{{ fn.diff_ct }}</span>
              <span class="pc__change-pct">{{
                diffPct(Number(fn.base_ct), Number(fn.compare_ct))
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="pc__status"
    >
      No data to compare.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pc {
  @apply flex flex-col h-full overflow-hidden;
}

/* ---- Legend ---- */
.pc__legend {
  @apply flex items-center gap-3 px-4 py-2.5 flex-shrink-0;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.pc__legend-item {
  @apply flex items-center gap-1.5;
}

.pc__legend-dot {
  @apply w-2 h-2 rounded-full;
}

.pc__legend-dot--base {
  @apply bg-blue-500;
}

.pc__legend-dot--compare {
  @apply bg-violet-500;
}

.pc__legend-link {
  @apply font-mono text-2xs px-1 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply text-blue-600 dark:text-blue-400;
  @apply hover:bg-blue-50 dark:hover:bg-blue-500/10;
  @apply hover:underline transition-colors;
}

.pc__legend-vs {
  @apply text-gray-300 dark:text-gray-600 text-2xs;
}

.pc__legend-hint {
  @apply ml-auto text-2xs;
}

.pc__legend-sep {
  @apply text-gray-300 dark:text-gray-600 mx-1;
}

/* ---- Status ---- */
.pc__status {
  @apply text-sm text-gray-400 dark:text-gray-500 text-center py-12;
}

/* ---- Scrollable table ---- */
.pc__scroll {
  @apply flex-1 overflow-auto;
}

.pc__table {
  @apply w-full text-xs;
  border-collapse: separate;
  border-spacing: 0;
}

/* ---- Header ---- */
.pc__th {
  @apply text-left px-3 py-2 font-semibold text-2xs uppercase tracking-wider;
  @apply text-gray-400 dark:text-gray-500;
  @apply border-b-2 border-gray-200 dark:border-gray-700;
  @apply sticky top-0 z-10;
  @apply bg-gray-50 dark:bg-gray-900;
}

.pc__th--fn {
  min-width: 220px;
}

.pc__th--num {
  @apply text-right;
}

.pc__th--change {
  min-width: 100px;
}

/* ---- Rows (zebra) ---- */
.pc__row {
  @apply transition-colors;

  &:nth-child(odd) {
    @apply bg-white dark:bg-gray-900;
  }

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/40;
  }

  &:hover {
    @apply bg-blue-50/50 dark:bg-blue-500/[0.04];
  }
}

/* ---- Cells ---- */
.pc__td {
  @apply px-3 py-1.5;
  @apply border-b border-gray-100 dark:border-gray-800/60;
  @apply text-gray-700 dark:text-gray-300;
}

.pc__td--fn {
  @apply font-mono truncate;
  max-width: 300px;
}

.pc__td--num {
  @apply text-right font-mono tabular-nums whitespace-nowrap;
}

.pc__td--change {
  @apply font-semibold;
}

/* ---- Value parts ---- */
.pc__val-base {
  @apply text-gray-400 dark:text-gray-500;
}

.pc__arrow {
  @apply text-gray-300 dark:text-gray-600 mx-1;
}

.pc__val-compare {
  @apply text-gray-700 dark:text-gray-200;
}

.pc__change-abs {
  @apply block leading-tight;
}

.pc__change-pct {
  @apply block text-2xs opacity-60 leading-tight;
}

/* ---- Diff colors ---- */
.pc__faster {
  @apply text-green-600 dark:text-green-400;
}

.pc__slower {
  @apply text-red-600 dark:text-red-400;
}
</style>
