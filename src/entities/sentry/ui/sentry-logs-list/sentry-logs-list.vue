<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { SentryLog } from '../../types'
import SentryLogRow from './sentry-log-row.vue'

type Props = {
  logs: SentryLog[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const levels = ['all', 'debug', 'info', 'warn', 'error', 'fatal'] as const
const activeLevel = ref<string>('all')

const setLevel = (lvl: string) => {
  activeLevel.value = lvl
}

const filteredLogs = computed(() => {
  if (activeLevel.value === 'all') return props.logs
  return props.logs.filter((l) => {
    if (activeLevel.value === 'warn') return l.level === 'warn' || l.level === 'warning'
    if (activeLevel.value === 'error') return l.level === 'error' || l.level === 'fatal'
    return l.level === activeLevel.value
  })
})

const chipClass = (lvl: string) => {
  if (activeLevel.value !== lvl) return ''
  if (lvl === 'error' || lvl === 'fatal') return 'logs-list__chip--error'
  if (lvl === 'warn') return 'logs-list__chip--warning'
  if (lvl === 'info') return 'logs-list__chip--info'
  return 'logs-list__chip--active'
}
</script>

<template>
  <div class="logs-list">
    <div class="logs-list__filters">
      <button
        v-for="lvl in levels"
        :key="lvl"
        class="logs-list__chip"
        :class="[{ 'logs-list__chip--active': activeLevel === lvl }, chipClass(lvl)]"
        @click="setLevel(lvl)"
      >
        {{ lvl }}
      </button>
    </div>

    <div class="logs-list__rows">
      <SentryLogRow
        v-for="log in filteredLogs"
        :key="log.id"
        :log="log"
      />

      <div
        v-if="loading"
        class="logs-list__status"
      >
        Loading...
      </div>

      <div
        v-if="!loading && filteredLogs.length === 0"
        class="logs-list__status"
      >
        No logs match the selected filter.
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logs-list {
  @apply flex flex-col;
}

.logs-list__filters {
  @apply flex items-center gap-1 px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.logs-list__chip {
  @apply text-2xs font-semibold uppercase tracking-wide;
  @apply px-2 py-1 rounded cursor-pointer;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50;
  @apply transition-colors duration-100;
}

.logs-list__chip--active {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white;
}

.logs-list__chip--error {
  @apply bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400;
}

.logs-list__chip--warning {
  @apply bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400;
}

.logs-list__chip--info {
  @apply bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400;
}

.logs-list__rows {
  @apply flex-1 overflow-auto;
}

.logs-list__status {
  @apply flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500;
}
</style>
