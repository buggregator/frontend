<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SOURCE_LABEL,
  SentryViewIcon,
  serviceColors,
  spansWithRoot,
  useSentryTraces,
  useTraceView,
  RequestTimeline,
  TraceCallGraph,
  TraceFlameGraph,
  TraceInsight,
  TraceRelatedLogs,
  TraceSequence,
  TraceWaterfall
} from '@/entities/sentry'
import type { SentryTraceDetail } from '@/entities/sentry/types'
import { logger } from '@/shared/lib/logger'
import { RouteName } from '@/shared/types'
import { Tabs, tabIdOf, type TabItem } from '@/shared/ui'
import { useTraceMarkers } from '../../lib/use-trace-markers'

const { params } = useRoute()
const router = useRouter()
const traceId = params.traceId as string

useTitle(`Trace ${traceId} | Buggregator`)

const formatTime = (ts: string) => (ts ? moment(ts).fromNow() : '')

const { fetchDetail } = useSentryTraces()
const detail = ref<SentryTraceDetail | null>(null)
const loading = ref(false)
// Waterfall, the trace graphs (#6533 A) and the related lists in one row of
// view tabs (#6543 B), the view in the URL (?view=…).
const { view, select: selectView } = useTraceView()

// Flame graph and call graph share the selected span; «Show in waterfall»
// opens that span in the waterfall.
const selectedSpanId = ref<string | null>(null)
const openSpanId = ref<string | null>(null)
const showInWaterfall = (spanId: string) => {
  selectedSpanId.value = spanId
  openSpanId.value = spanId
  selectView('waterfall')
}
const viewTabs = computed<TabItem[]>(() => [
  { id: 'request', label: 'Request', icon: 'timeline' },
  { id: 'waterfall', label: 'Waterfall', icon: 'waterfall' },
  { id: 'flame', label: 'Flame graph', icon: 'flame' },
  { id: 'graph', label: 'Call graph', icon: 'graph' },
  { id: 'sequence', label: 'Sequence', icon: 'sequence' },
  ...(detail.value?.related_errors.length
    ? [{ id: 'errors', label: 'Related errors', count: detail.value.related_errors.length }]
    : []),
  ...(detail.value?.related_log_count ? [{ id: 'logs', label: 'Related logs', count: detail.value.related_log_count }] : [])
])
// A related list the trace does not have (an old link): the request view.
const activeTab = computed(() => (viewTabs.value.some((t) => t.id === view.value) ? view.value : 'request'))
// Logs, mails and HTTP dumps with this trace id, Sentry errors and logs (#6715).
const { markers, error: markersError } = useTraceMarkers(detail)
const colors = computed(() => serviceColors(waterfallSpans.value))
const spanIds = computed(() => new Set(waterfallSpans.value.map((s) => s.span_id)))
// The graphs fill the page under the tabs (#6533 «fullheight»).
const isGraphTab = computed(() => ['flame', 'graph', 'sequence'].includes(activeTab.value))

// Spans, services and sources of the trace (#6523): a trace may run through
// a Sentry SDK service and OpenTelemetry ones.
const waterfallSpans = computed(() => (detail.value ? spansWithRoot(detail.value) : []))
const serviceCount = computed(
  () => new Set(waterfallSpans.value.map((s) => s.service_name).filter(Boolean)).size
)
const sources = computed(() => (detail.value?.transaction.sources ?? []).map((s) => SOURCE_LABEL[s] ?? s))

onMounted(async () => {
  loading.value = true
  try {
    detail.value = await fetchDetail(traceId)
    if (!detail.value) {
      await router.replace({ name: RouteName.NotFound })
    }
  } catch (error) {
    logger(['UI: Failed to load trace detail', error])
    await router.replace({ name: RouteName.NotFound })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="trace-detail">
    <div
      v-if="loading"
      class="trace-detail__loading"
    >
      Loading trace...
    </div>

    <template v-else-if="detail">
      <div class="trace-detail__header">
        <h1 class="trace-detail__title">
          {{ detail.transaction.transaction_name }}
        </h1>
        <div class="trace-detail__meta">
          <span class="trace-detail__badge trace-detail__badge--op">{{
            detail.transaction.op
          }}</span>
          <span class="trace-detail__badge">{{ detail.transaction.duration_ms }}ms</span>
          <span class="trace-detail__badge">{{ detail.spans.length }} spans</span>
          <span
            v-if="serviceCount"
            class="trace-detail__badge"
            data-test="trace-service-count"
          >{{ serviceCount }} service{{ serviceCount !== 1 ? 's' : '' }}</span>
          <span
            v-for="source in sources"
            :key="source"
            class="trace-detail__badge trace-detail__badge--source"
            data-test="trace-detail-source"
          >{{ source }}</span>
          <span
            class="trace-detail__badge"
            :class="
              detail.transaction.status === 'ok'
                ? 'trace-detail__badge--ok'
                : 'trace-detail__badge--status'
            "
          >
            {{ detail.transaction.status }}
          </span>
          <span class="trace-detail__trace-id">{{ detail.trace_id }}</span>
        </div>
      </div>

      <div class="trace-detail__views">
        <Tabs
          :tabs="viewTabs"
          :current="activeTab"
          label="Trace view"
          panel-id="trace-view-panel"
          test-prefix="view-tab-"
          @select="selectView"
        >
          <template #icon="{ tab }">
            <SentryViewIcon
              v-if="tab.icon"
              :name="tab.icon"
            />
          </template>
        </Tabs>
      </div>

      <div
        id="trace-view-panel"
        role="tabpanel"
        :aria-labelledby="tabIdOf('trace-view-panel', activeTab)"
        class="trace-detail__content"
        :class="{ 'trace-detail__content--graph': isGraphTab, 'trace-detail__content--request': activeTab === 'request' }"
      >
        <RequestTimeline
          v-if="activeTab === 'request'"
          :detail="detail"
          :markers="markers"
          :markers-error="markersError"
        />

        <TraceWaterfall
          v-if="activeTab === 'waterfall'"
          :spans="waterfallSpans"
          :total-ms="detail.transaction.duration_ms"
          :trace-id="detail.trace_id"
          :open-span-id="openSpanId"
        />

        <TraceInsight
          v-if="activeTab === 'flame' || activeTab === 'graph'"
          :spans="waterfallSpans"
          @select="selectedSpanId = $event"
        />
        <TraceFlameGraph
          v-if="activeTab === 'flame'"
          :spans="waterfallSpans"
          :selected-span-id="selectedSpanId"
          @select="selectedSpanId = $event"
          @show-in-waterfall="showInWaterfall"
        />
        <TraceCallGraph
          v-if="activeTab === 'graph'"
          :spans="waterfallSpans"
          :selected-span-id="selectedSpanId"
          @select="selectedSpanId = $event"
          @show-in-waterfall="showInWaterfall"
        />
        <TraceSequence
          v-if="activeTab === 'sequence'"
          :trace-id="detail.trace_id"
          :colors="colors"
        />

        <div
          v-if="activeTab === 'errors'"
          class="trace-detail__errors"
        >
          <div
            v-for="err in detail.related_errors"
            :key="err.id"
            class="trace-detail__error-row"
          >
            <RouterLink
              :to="{ name: RouteName.SentryExceptionDetail, params: { id: err.id } }"
              class="trace-detail__error-link"
            >
              {{ err.exception_type || 'Error' }}
            </RouterLink>
            <span class="trace-detail__error-time">{{ formatTime(err.received_at) }}</span>
          </div>
        </div>

        <TraceRelatedLogs
          v-if="activeTab === 'logs'"
          :trace-id="detail.trace_id"
          :span-ids="spanIds"
          @span="showInWaterfall"
        />
      </div>
    </template>

    <div
      v-else
      class="trace-detail__loading"
    >
      Trace not found.
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/entities/sentry/ui/sentry-list-views/view-bar';

.trace-detail {
  @apply flex flex-col h-full;
}

.trace-detail__views {
  @include view-bar.bar;
}

.trace-detail__loading {
  @apply flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400;
}

.trace-detail__header {
  @apply px-5 py-5;
  @apply border-b border-gray-200 dark:border-gray-700/50;
  @apply bg-gray-50 dark:bg-gray-900;
}

.trace-detail__title {
  @apply font-bold text-base md:text-lg break-all sm:break-normal mb-2;
  @apply text-gray-900 dark:text-gray-100;
}

.trace-detail__meta {
  @apply flex flex-wrap items-center gap-1.5;
}

.trace-detail__badge {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300;
}

.trace-detail__badge--source {
  @apply font-mono bg-transparent dark:bg-transparent border border-gray-200 dark:border-gray-600;
}

.trace-detail__badge--op {
  @apply font-semibold;
  @apply text-violet-600 dark:text-violet-400;
  @apply bg-violet-50 dark:bg-violet-500/10;
}

.trace-detail__badge--ok {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.trace-detail__badge--status {
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
}

.trace-detail__trace-id {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400 ml-auto;
}

.trace-detail__content {
  @apply flex-1 overflow-auto p-5;
  @apply bg-white dark:bg-gray-800;
}

// Edge to edge: the request view has its own padding and side panel.
.trace-detail__content--request {
  @apply p-0;
}

// Edge to edge, down to the bottom of the screen; the graph scrolls itself.
.trace-detail__content--graph {
  @apply p-0 flex flex-col overflow-hidden min-h-[420px];
}

.trace-detail__errors {
  @apply rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.trace-detail__error-row {
  @apply flex items-center justify-between px-3 py-2;
  @apply bg-white dark:bg-gray-800;
  @apply hover:bg-gray-50 dark:hover:bg-gray-900;
  @apply transition-colors duration-100;
}

.trace-detail__error-link {
  @apply text-sm font-medium text-red-600 dark:text-red-400 hover:underline;
}

.trace-detail__error-time {
  @apply text-2xs font-mono text-gray-500 dark:text-gray-400;
}
</style>
