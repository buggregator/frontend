<script lang="ts" setup>
import moment from 'moment'
import { computed, ref } from 'vue'
import { RouteName } from '@/shared/types'
import type { SentryLog } from '../../types'

type Props = {
  log: SentryLog
}

const props = defineProps<Props>()

const expanded = ref(false)

const levelClass = computed(() => {
  const l = props.log.level
  if (l === 'error' || l === 'fatal') return 'log-level--error'
  if (l === 'warn' || l === 'warning') return 'log-level--warning'
  if (l === 'info') return 'log-level--info'
  return 'log-level--debug'
})

const formattedTime = computed(() => {
  if (!props.log.log_ts) return ''
  return moment(props.log.log_ts).format('HH:mm:ss.SSS')
})

const truncate = (text: string, max: number) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '...' : text
}

const formatAttrValue = (val: unknown): string => {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<template>
  <div
    class="log-row"
    :class="{
      'log-row--expanded': expanded,
      'log-row--error': log.level === 'error' || log.level === 'fatal'
    }"
    @click="expanded = !expanded"
  >
    <div class="log-row__main">
      <span
        class="log-row__level"
        :class="levelClass"
      >
        {{ log.level.toUpperCase() }}
      </span>

      <span class="log-row__body">{{ truncate(log.body, 120) }}</span>

      <span class="log-row__time">{{ formattedTime }}</span>

      <RouterLink
        v-if="log.trace_id && log.trace_exists"
        :to="{ name: RouteName.SentryTraceDetail, params: { traceId: log.trace_id } }"
        class="log-row__trace-link"
        @click.stop
      >
        trace &rarr;
      </RouterLink>
    </div>

    <!-- Expandable attributes block -->
    <div
      v-if="expanded && log.attributes"
      class="log-row__attrs"
    >
      <div class="log-row__attrs-header">
        Attributes
      </div>
      <div class="log-row__attrs-body">
        <div
          v-for="(val, key) in log.attributes"
          :key="String(key)"
          class="log-row__attr-row"
        >
          <span class="log-row__attr-key">{{ key }}</span>
          <span class="log-row__attr-val">{{ formatAttrValue(val) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-row {
  @apply px-3 py-2 cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply transition-colors duration-100;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.log-row--expanded {
  @apply bg-gray-50 dark:bg-gray-900;
}

.log-row--error {
  @apply border-l-2 border-l-red-500;
}

.log-row__main {
  @apply flex items-center gap-2;
}

.log-row__level {
  @apply inline-flex items-center px-2 py-0.5 rounded;
  @apply text-2xs font-bold uppercase tracking-wide;
  @apply flex-shrink-0 min-w-[50px] text-center justify-center;
}

.log-level--debug {
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-600/50;
}

.log-level--info {
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
}

.log-level--warning {
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
}

.log-level--error {
  @apply text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10;
}

.log-row__body {
  @apply flex-1 text-xs font-mono truncate;
  @apply text-gray-700 dark:text-gray-300;
}

.log-row__time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0;
}

.log-row__trace-link {
  @apply text-2xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded;
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply hover:bg-blue-100 dark:hover:bg-blue-500/20;
  @apply transition-colors duration-100;
}

/* Expandable attributes block - follows monolog block pattern */
.log-row__attrs {
  @apply mt-2 rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.log-row__attrs-header {
  @apply px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.log-row__attrs-body {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.log-row__attr-row {
  @apply flex py-1.5 px-3 text-2xs;
  @apply bg-white dark:bg-gray-800;

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/50;
  }
}

.log-row__attr-key {
  @apply w-1/4 font-medium text-gray-500 dark:text-gray-400 flex-shrink-0;
  @apply border-r border-gray-200 dark:border-gray-700 pr-3;
}

.log-row__attr-val {
  @apply w-3/4 font-mono text-gray-700 dark:text-gray-200 pl-3 break-all;
}
</style>
