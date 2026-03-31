<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { SentrySpan } from '../../types'

type Props = {
  spans: SentrySpan[]
  totalMs: number
}

const props = defineProps<Props>()

type DisplaySpan = SentrySpan & { indent: number }

const displayList = computed<DisplaySpan[]>(() => {
  const spans = props.spans
  if (!spans.length) return []

  const childrenMap = new Map<string, SentrySpan[]>()

  for (const s of spans) {
    const pid = s.parent_span_id || '__root__'
    if (!childrenMap.has(pid)) childrenMap.set(pid, [])
    childrenMap.get(pid)!.push(s)
  }

  // DFS from roots (no parent or parent not in set)
  const spanIds = new Set(spans.map((s) => s.span_id))
  const roots = spans.filter((s) => !s.parent_span_id || !spanIds.has(s.parent_span_id))
  roots.sort((a, b) => a.start_offset_ms - b.start_offset_ms)

  const queue = roots.map((r) => ({ span: r, level: 0 }))
  const result: DisplaySpan[] = []

  while (queue.length) {
    const { span, level } = queue.shift()!
    result.push({ ...span, indent: level })
    const children = childrenMap.get(span.span_id) || []
    children.sort((a, b) => a.start_offset_ms - b.start_offset_ms)
    // Insert children at front of queue for DFS-like ordering
    queue.unshift(...children.map((c) => ({ span: c, level: level + 1 })))
  }

  return result
})

const expandedSpans = ref(new Set<string>())

const toggleExpand = (spanId: string) => {
  if (expandedSpans.value.has(spanId)) {
    expandedSpans.value.delete(spanId)
  } else {
    expandedSpans.value.add(spanId)
  }
}

const barStyle = (span: SentrySpan) => {
  if (!props.totalMs || props.totalMs <= 0) return {}
  const left = Math.max(0, (span.start_offset_ms / props.totalMs) * 100)
  const width = Math.max(0.5, (span.duration_ms / props.totalMs) * 100)
  return {
    left: `${left}%`,
    width: `${Math.min(width, 100 - left)}%`,
    backgroundColor: opColor(span.peer_type, span.op)
  }
}

const opColor = (peerType: string | null, op?: string) => {
  if (peerType === 'db') return '#EF9F27'
  if (peerType === 'http') return '#85B7EB'
  if (peerType === 'cache') return '#5DCAA5'
  if (peerType === 'queue') return '#B4B2A9'
  if (op?.startsWith('http.server')) return '#AFA9EC'
  return '#AFA9EC'
}

const opBadgeClass = (peerType: string | null, op?: string) => {
  if (peerType === 'db') return 'wf-op--db'
  if (peerType === 'http') return 'wf-op--http'
  if (peerType === 'cache') return 'wf-op--cache'
  if (peerType === 'queue') return 'wf-op--queue'
  if (op?.startsWith('http.server')) return 'wf-op--server'
  return 'wf-op--default'
}

const truncate = (text: string, max: number) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '...' : text
}
</script>

<template>
  <div class="trace-wf">
    <!-- Column header -->
    <div class="trace-wf__header">
      <div class="trace-wf__col-label">
        Operation
      </div>
      <div class="trace-wf__col-bar">
        Timeline
      </div>
      <div class="trace-wf__col-dur">
        Duration
      </div>
    </div>

    <!-- Span rows -->
    <div
      v-for="(span, idx) in displayList"
      :key="span.span_id"
      class="trace-wf__row"
      :class="{
        'trace-wf__row--error': span.is_error,
        'trace-wf__row--even': idx % 2 === 0,
        'trace-wf__row--expanded': expandedSpans.has(span.span_id)
      }"
    >
      <!-- Label cell -->
      <div
        class="trace-wf__label"
        :style="{ paddingLeft: `${span.indent * 16 + 8}px` }"
        :title="span.description || span.op"
        @click="toggleExpand(span.span_id)"
      >
        <!-- Expand indicator -->
        <svg
          class="trace-wf__expand-icon"
          :class="{ 'trace-wf__expand-icon--open': expandedSpans.has(span.span_id) }"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1.5 1L5 4.5L8.5 1"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <span
          class="trace-wf__op-badge"
          :class="opBadgeClass(span.peer_type, span.op)"
        >
          {{ span.op }}
        </span>
        <span class="trace-wf__desc">{{ truncate(span.description || '', 40) }}</span>
      </div>

      <!-- Timeline bar cell -->
      <div class="trace-wf__track">
        <div
          class="trace-wf__bar"
          :class="{ 'trace-wf__bar--error': span.is_error }"
          :style="barStyle(span)"
        />
        <span
          v-if="span.is_error"
          class="trace-wf__error-tag"
        >error</span>
      </div>

      <!-- Duration cell -->
      <div class="trace-wf__dur">
        {{ span.duration_ms }}ms
      </div>

      <!-- Expanded details -->
      <div
        v-if="expandedSpans.has(span.span_id)"
        class="trace-wf__details"
      >
        <div
          class="trace-wf__attrs-container"
          :style="{ marginLeft: `${span.indent * 16 + 28}px` }"
        >
          <div class="trace-wf__attrs-title">
            Span attributes
          </div>
          <div class="trace-wf__attrs-table">
            <div
              v-if="span.span_id"
              class="trace-wf__attr-row"
            >
              <span class="trace-wf__attr-key">span_id</span>
              <span class="trace-wf__attr-val">{{ span.span_id }}</span>
            </div>
            <div
              v-if="span.parent_span_id"
              class="trace-wf__attr-row"
            >
              <span class="trace-wf__attr-key">parent_span_id</span>
              <span class="trace-wf__attr-val">{{ span.parent_span_id }}</span>
            </div>
            <div
              v-if="span.status"
              class="trace-wf__attr-row"
            >
              <span class="trace-wf__attr-key">status</span>
              <span class="trace-wf__attr-val">{{ span.status }}</span>
            </div>
            <div
              v-if="span.peer_type"
              class="trace-wf__attr-row"
            >
              <span class="trace-wf__attr-key">peer_type</span>
              <span class="trace-wf__attr-val">{{ span.peer_type }}</span>
            </div>
            <div
              v-if="span.peer_address"
              class="trace-wf__attr-row"
            >
              <span class="trace-wf__attr-key">peer_address</span>
              <span class="trace-wf__attr-val">{{ span.peer_address }}</span>
            </div>
            <div class="trace-wf__attr-row">
              <span class="trace-wf__attr-key">start_offset_ms</span>
              <span class="trace-wf__attr-val">{{ span.start_offset_ms }}</span>
            </div>
            <div class="trace-wf__attr-row">
              <span class="trace-wf__attr-key">duration_ms</span>
              <span class="trace-wf__attr-val">{{ span.duration_ms }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!displayList.length"
      class="trace-wf__empty"
    >
      No spans found.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trace-wf {
  @apply text-xs;
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.trace-wf__header {
  @apply flex items-center gap-2 px-3 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply text-2xs font-mono font-semibold uppercase tracking-wider;
  @apply text-gray-500 dark:text-gray-400;
}

.trace-wf__col-label {
  @apply w-56 lg:w-72 flex-shrink-0;
}
.trace-wf__col-bar {
  @apply flex-1 min-w-0;
}
.trace-wf__col-dur {
  @apply w-20 text-right flex-shrink-0;
}

.trace-wf__row {
  @apply flex flex-wrap items-center gap-2 px-3 py-1.5;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
  @apply transition-colors duration-100;

  &:last-child {
    @apply border-b-0;
  }

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.trace-wf__row--even {
  @apply bg-gray-50/50 dark:bg-gray-800/50;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.trace-wf__row--error {
  @apply bg-red-50/50 dark:bg-red-500/5;

  &:hover {
    @apply bg-red-50 dark:bg-red-500/10;
  }
}

.trace-wf__row--expanded {
  @apply bg-gray-50 dark:bg-gray-900;
}

.trace-wf__label {
  @apply w-72 flex-shrink-0 truncate cursor-pointer flex items-center gap-1.5;
}

.trace-wf__expand-icon {
  @apply w-2.5 h-2.5 flex-shrink-0 text-gray-400 dark:text-gray-500;
  transition: transform 0.15s ease;
}

.trace-wf__expand-icon--open {
  transform: rotate(180deg);
}

.trace-wf__op-badge {
  @apply inline-flex items-center px-1 py-0 rounded;
  @apply text-2xs font-semibold;
  @apply flex-shrink-0;
}

.wf-op--db {
  @apply text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10;
}
.wf-op--http {
  @apply text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10;
}
.wf-op--cache {
  @apply text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10;
}
.wf-op--queue {
  @apply text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/50;
}
.wf-op--server {
  @apply text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10;
}
.wf-op--default {
  @apply text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10;
}

.trace-wf__desc {
  @apply text-gray-400 dark:text-gray-500 truncate font-mono text-2xs;
}

.trace-wf__track {
  @apply flex-1 h-4 relative rounded-sm;
  @apply bg-gray-100 dark:bg-gray-700;
}

.trace-wf__bar {
  @apply absolute top-0 h-full rounded-sm;
  min-width: 2px;
  @apply transition-all duration-100;
}

.trace-wf__bar--error {
  outline: 1.5px solid #e24b4a;
}

.trace-wf__error-tag {
  @apply absolute text-2xs font-semibold whitespace-nowrap;
  @apply text-red-600 dark:text-red-400;
  top: 0;
  right: -36px;
}

.trace-wf__dur {
  @apply w-16 text-right flex-shrink-0 font-mono text-gray-500 dark:text-gray-400;
}

/* Expanded attributes panel */
.trace-wf__details {
  @apply w-full py-2;
}

.trace-wf__attrs-container {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.trace-wf__attrs-title {
  @apply px-3 py-1.5;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply text-2xs font-medium text-gray-500 dark:text-gray-400;
}

.trace-wf__attrs-table {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.trace-wf__attr-row {
  @apply flex items-center py-1.5 px-3 text-2xs;
  @apply bg-white dark:bg-gray-800;

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/50;
  }
}

.trace-wf__attr-key {
  @apply w-1/4 font-medium text-gray-500 dark:text-gray-400;
  @apply border-r border-gray-200 dark:border-gray-700 pr-3;
}

.trace-wf__attr-val {
  @apply w-3/4 font-mono text-gray-700 dark:text-gray-200 pl-3 break-all;
}

.trace-wf__empty {
  @apply py-8 text-center text-gray-400 dark:text-gray-500;
}
</style>
