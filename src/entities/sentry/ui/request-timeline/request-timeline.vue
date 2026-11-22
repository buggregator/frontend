<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import { buildRequestTimeline, timelineSummary, type TimelineItem, type TimelineMarker } from '../../lib/request-timeline'
import type { SentryTraceDetail } from '../../types'
import TimelineDetails from './timeline-details.vue'
import TimelineLanes from './timeline-lanes.vue'
import TimelineList from './timeline-list.vue'
import TraceNPlusOne from './trace-n-plus-one.vue'

// One request on one time scale (#6715): a lane per kind, the N+1 hint on
// top, the same items as a list by time under it and the selected one on the
// right. Phone: the list only (the lanes need width).

type Props = {
  detail: SentryTraceDetail
  // Events of other modules with this trace id (logs, mails, HTTP dumps).
  markers?: TimelineMarker[]
  // Why those events are missing, when they could not load.
  markersError?: string
}

const props = withDefaults(defineProps<Props>(), { markers: () => [], markersError: '' })

const timeline = computed(() => buildRequestTimeline(props.detail, props.markers))
const summary = computed(() => timelineSummary(timeline.value))
const selected = ref<TimelineItem | null>(null)
const list = ref<InstanceType<typeof TimelineList> | null>(null)

const select = (item: TimelineItem) => {
  selected.value = item
}

// From the N+1 hint: open its block and bring its row into view.
const selectGroup = async (spanId: string) => {
  const item = timeline.value.list.find((i) => i.kind === 'group' && i.spans.some((s) => s.span_id === spanId))
  if (!item) return
  selected.value = item
  await nextTick()
  list.value?.focusRow(item.id)
}

const close = async () => {
  const id = selected.value?.id
  selected.value = null
  await nextTick()
  if (id) list.value?.focusRow(id)
}
</script>

<template>
  <div
    class="request-timeline"
    data-test="request-timeline"
  >
    <ul
      v-if="summary.length"
      class="request-timeline__summary"
      aria-label="What the request did"
    >
      <li
        v-for="part in summary"
        :key="part.lane"
        class="request-timeline__summary-part"
        :class="{ 'request-timeline__summary-part--error': part.tone === 'error' }"
      >
        {{ part.text }}
      </li>
    </ul>

    <TraceNPlusOne
      v-for="n in props.detail.n_plus_one ?? []"
      :key="n.span_ids[0] ?? n.query"
      :n-plus-one="n"
      @select="selectGroup"
    />

    <div class="request-timeline__body">
      <div class="request-timeline__main">
        <TimelineLanes
          :timeline="timeline"
          :selected-id="selected?.id ?? null"
          @select="select"
        />
        <p
          v-if="props.markersError"
          class="request-timeline__note request-timeline__note--error"
          role="alert"
        >
          Logs, mails and HTTP dumps of this request could not load: {{ props.markersError }}
        </p>
        <TimelineList
          ref="list"
          :items="timeline.list"
          :selected-id="selected?.id ?? null"
          @select="select"
        />
      </div>

      <aside
        class="request-timeline__aside"
        aria-label="Selected item"
      >
        <TimelineDetails
          v-if="selected"
          :item="selected"
          :trace-id="props.detail.trace_id"
          @select="select"
          @close="close"
        />
        <template v-else>
          <p class="request-timeline__aside-title">
            Where these come from
          </p>
          <p class="request-timeline__note">
            Queries, cache, outgoing calls and the request itself come from Sentry spans. Monolog logs, mails and
            HTTP dumps join this page when they carry the same <code>trace_id</code>.
          </p>
        </template>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.request-timeline {
  @apply flex flex-col min-h-0;
}

.request-timeline__summary {
  @apply flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 text-xs text-gray-700 dark:text-gray-300;
  @apply border-b border-gray-200 dark:border-gray-700/50;
}

.request-timeline__summary-part {
  @apply whitespace-nowrap;

  & + &::before {
    content: '·';
    @apply mr-3 text-gray-400 dark:text-gray-500;
  }
}

.request-timeline__summary-part--error {
  @apply text-red-700 dark:text-red-400;
}

.request-timeline__body {
  @apply flex flex-col min-h-0 flex-1;

  @media (min-width: 1024px) {
    flex-direction: row;
  }
}

.request-timeline__main {
  @apply flex-1 min-w-0 p-4 flex flex-col gap-3;
}

.request-timeline__aside {
  @apply w-full flex-none p-4 text-xs;

  @media (min-width: 1024px) {
    width: 20rem;
  }
  @apply border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700/50;
}

.request-timeline__aside-title {
  @apply text-2xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2;
}

.request-timeline__note {
  @apply text-xs text-gray-600 dark:text-gray-400;

  code {
    @apply font-mono;
  }
}

.request-timeline__note--error {
  @apply text-red-700 dark:text-red-400;
}
</style>
