<script lang="ts" setup>
import moment from 'moment'
import { computed, ref } from 'vue'
import { RouteName } from '@/shared/types'
import { SOURCE_LABEL, formatAttrValue, splitOtelAttributes } from '../../lib/otel'
import type { SentryLog } from '../../types'

type Props = {
  log: SentryLog
  // Inside a trace page (#6533 related-logs): its spans; a log of one of them
  // gets a «span» button instead of the link to the same trace.
  traceSpans?: Set<string> | null
}

const props = withDefaults(defineProps<Props>(), { traceSpans: null })
const emit = defineEmits<{ span: [spanId: string] }>()
const inTrace = computed(() => props.traceSpans !== null)
const spanInTrace = computed(() => !!props.log.span_id && !!props.traceSpans?.has(props.log.span_id))

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

// OTel logs carry otel.resource / otel.scope in attributes: shown apart (#6523).
const parts = computed(() => splitOtelAttributes(props.log.attributes))
const hasResource = computed(() => Object.keys(parts.value.resource).length > 0)
const sourceLabel = computed(() => (props.log.source ? SOURCE_LABEL[props.log.source] : ''))
const hasDetails = computed(
  () => Object.keys(parts.value.attributes).length > 0 || hasResource.value || !!props.log.trace_id
)
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
    <div
      class="log-row__main"
      role="button"
      tabindex="0"
      :aria-expanded="hasDetails ? expanded : undefined"
      @keydown.enter.self.prevent="expanded = !expanded"
      @keydown.space.self.prevent="expanded = !expanded"
    >
      <span
        class="log-row__level"
        :class="levelClass"
      >
        {{ log.level.toUpperCase() }}
      </span>

      <span
        class="log-row__service"
        :title="log.service_name ?? undefined"
        data-test="log-service"
      >{{ log.service_name ?? '' }}</span>

      <span class="log-row__body">{{ truncate(log.body, 120) }}</span>

      <span class="log-row__time">{{ formattedTime }}</span>

      <button
        v-if="spanInTrace"
        type="button"
        class="log-row__trace-link"
        title="Show this span in the waterfall"
        data-test="log-span"
        @click.stop="emit('span', log.span_id!)"
      >
        span &rarr;
      </button>
      <RouterLink
        v-else-if="!inTrace && log.trace_id && log.trace_exists"
        :to="{ name: RouteName.SentryTraceDetail, params: { traceId: log.trace_id } }"
        class="log-row__trace-link"
        @click.stop
      >
        trace &rarr;
      </RouterLink>
    </div>

    <!-- Expandable details: attributes; resource and trace for OTel logs -->
    <div
      v-if="expanded && hasDetails"
      class="log-row__details"
      :class="{ 'log-row__details--split': hasResource }"
      data-test="log-details"
      @click.stop
    >
      <div
        v-if="Object.keys(parts.attributes).length"
        class="log-row__attrs"
      >
        <div class="log-row__attrs-header">
          Attributes
        </div>
        <div class="log-row__attrs-body">
          <div
            v-for="(val, key) in parts.attributes"
            :key="String(key)"
            class="log-row__attr-row"
          >
            <span class="log-row__attr-key">{{ key }}</span>
            <span class="log-row__attr-val">{{ formatAttrValue(val) }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="hasResource || log.trace_id"
        class="log-row__side"
      >
        <div
          v-if="hasResource"
          class="log-row__attrs"
          data-test="log-resource"
        >
          <div class="log-row__attrs-header">
            Resource
            <span
              v-if="sourceLabel"
              class="log-row__source"
            >{{ sourceLabel }}</span>
          </div>
          <div class="log-row__attrs-body">
            <div
              v-for="(val, key) in parts.resource"
              :key="String(key)"
              class="log-row__attr-row"
            >
              <span class="log-row__attr-key">{{ key }}</span>
              <span class="log-row__attr-val">{{ formatAttrValue(val) }}</span>
            </div>
          </div>
        </div>
        <div
          v-if="log.trace_id"
          class="log-row__attrs"
        >
          <div class="log-row__attrs-header">
            Trace
          </div>
          <div class="log-row__attrs-body">
            <div class="log-row__attr-row">
              <span class="log-row__attr-key">trace_id</span>
              <span class="log-row__attr-val">{{ log.trace_id }}</span>
            </div>
            <div
              v-if="log.span_id"
              class="log-row__attr-row"
            >
              <span class="log-row__attr-key">span_id</span>
              <span class="log-row__attr-val">{{ log.span_id }}</span>
            </div>
          </div>
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

.log-row__main:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.log-row__level {
  @apply inline-flex items-center px-2 py-0.5 rounded;
  @apply text-2xs font-bold uppercase tracking-wide;
  @apply flex-shrink-0 min-w-[50px] text-center justify-center;
}

.log-level--debug {
  @apply text-gray-600 dark:text-gray-400;
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
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0;
}

.log-row__trace-link {
  @apply text-2xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded;
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply hover:bg-blue-100 dark:hover:bg-blue-500/20;
  @apply transition-colors duration-100;
}

.log-row__service {
  @apply w-28 flex-shrink-0 truncate text-2xs font-mono;
  @apply text-gray-600 dark:text-gray-400;
}

@media (max-width: 639px) {
  .log-row__service {
    @apply w-20;
  }
}

.log-row__details {
  @apply mt-2 grid gap-2 cursor-auto;
}

@media (min-width: 768px) {
  .log-row__details--split {
    @apply grid-cols-2;
  }
}

.log-row__side {
  @apply flex flex-col gap-2 min-w-0;
}

.log-row__source {
  @apply ml-1 font-mono normal-case text-gray-500 dark:text-gray-400;
}

/* Expandable attributes block - follows monolog block pattern */
.log-row__attrs {
  @apply rounded overflow-hidden min-w-0;
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
  // Long dotted keys wrap inside their column instead of running into the value.
  overflow-wrap: anywhere;
}

.log-row__attr-val {
  @apply w-3/4 font-mono text-gray-700 dark:text-gray-200 pl-3 break-all;
}
</style>
