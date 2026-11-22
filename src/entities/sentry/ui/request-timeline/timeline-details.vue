<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue'
import { formatMs, LANE_LABEL, type TimelineItem } from '../../lib/request-timeline'

// The selected item: a span opens the waterfall's span details; a block of
// identical spans lists them; a log, mail or dump links to its own page.

const SpanDetails = defineAsyncComponent(() => import('../trace-waterfall/span-details.vue'))

type Props = { item: TimelineItem; traceId: string }

const props = defineProps<Props>()
const emit = defineEmits<{ select: [item: TimelineItem]; close: [] }>()

// A long block lists its first spans; the rest are the same query.
const SHOWN = 50
const groupSpans = computed(() => (props.item.kind === 'group' ? props.item.spans.slice(0, SHOWN) : []))

const openSpan = (index: number) => {
  if (props.item.kind !== 'group') return
  const span = props.item.spans[index]
  emit('select', {
    kind: 'span',
    id: span.span_id,
    lane: props.item.lane,
    startMs: span.start_offset_ms,
    durationMs: span.duration_ms,
    label: span.description || span.op,
    isError: span.is_error,
    span
  })
}
</script>

<template>
  <SpanDetails
    v-if="props.item.kind === 'span'"
    :key="props.item.id"
    :span="props.item.span"
    :trace-id="props.traceId"
    @close="emit('close')"
  />

  <section
    v-else
    class="tl-details"
    data-test="timeline-details"
  >
    <header class="tl-details__head">
      <p class="tl-details__kind">
        {{ LANE_LABEL[props.item.lane] }} · at {{ formatMs(props.item.startMs) }}
      </p>
      <button
        type="button"
        class="tl-details__close"
        aria-label="Close details"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>
    <p
      class="tl-details__title"
      :class="{ 'tl-details__title--error': props.item.isError }"
    >
      {{ props.item.label }}
    </p>

    <template v-if="props.item.kind === 'group'">
      <p class="tl-details__line">
        Run {{ props.item.count }} times, {{ formatMs(props.item.totalMs) }} in total.
        <template v-if="props.item.nPlusOne?.origin">
          From <code>{{ props.item.nPlusOne.origin }}</code>.
        </template>
      </p>
      <ol class="tl-details__spans">
        <li
          v-for="(span, i) in groupSpans"
          :key="span.span_id"
        >
          <button
            type="button"
            class="tl-details__span"
            @click="openSpan(i)"
          >
            <span>{{ formatMs(span.start_offset_ms) }}</span>
            <span>{{ formatMs(span.duration_ms) }}</span>
          </button>
        </li>
      </ol>
      <p
        v-if="props.item.count > groupSpans.length"
        class="tl-details__line"
      >
        and {{ props.item.count - groupSpans.length }} more.
      </p>
    </template>

    <template v-else-if="props.item.kind === 'marker'">
      <p
        v-for="(line, i) in props.item.marker.details ?? []"
        :key="i"
        class="tl-details__line"
      >
        {{ line }}
      </p>
      <RouterLink
        v-if="props.item.marker.to"
        :to="props.item.marker.to as never"
        class="tl-details__link"
      >
        Open the event →
      </RouterLink>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.tl-details {
  @apply flex flex-col gap-2 text-xs;
}

.tl-details__head {
  @apply flex items-center justify-between gap-2;
}

.tl-details__kind {
  @apply text-2xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.tl-details__close {
  @apply px-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
}

.tl-details__title {
  @apply font-mono font-semibold break-all text-gray-900 dark:text-gray-100;
}

.tl-details__title--error {
  @apply text-red-700 dark:text-red-400;
}

.tl-details__line {
  @apply text-gray-700 dark:text-gray-300 break-words;

  code {
    @apply font-mono;
  }
}

.tl-details__spans {
  @apply flex flex-col max-h-64 overflow-auto rounded border border-gray-200 dark:border-gray-700;
}

.tl-details__span {
  @apply w-full flex justify-between px-2 py-1 font-mono text-gray-600 dark:text-gray-300;
  @apply hover:bg-gray-50 dark:hover:bg-gray-900;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500;
}

.tl-details__link {
  @apply text-blue-700 dark:text-blue-400 hover:underline;
}
</style>
