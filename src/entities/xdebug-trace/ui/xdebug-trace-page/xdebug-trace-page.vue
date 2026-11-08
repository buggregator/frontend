<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { formatFileSize } from '@/shared/lib/formats/format-file-size'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout, PageTab, PageTabs } from '@/shared/ui'
import { formatSeconds, traceSubtitle, traceTitle } from '../../lib/trace-format'
import { useTraceSearch } from '../../lib/use-trace-search'
import { useTraceTree } from '../../lib/use-trace-tree'
import { useXdebugTraceRequests } from '../../lib/use-xdebug-trace-requests'
import type { XdebugTrace, XdebugTraceNode, XdebugTraceSummary } from '../../types'
import { TraceSearch } from '../trace-search'
import { TraceSummary } from '../trace-summary'
import { TraceTree } from '../trace-tree'

type Props = {
  event: NormalizedEvent<XdebugTrace>
}

const props = defineProps<Props>()

const requests = useXdebugTraceRequests()
const tree = useTraceTree((query) => requests.getTree(props.event.id, query))
const search = useTraceSearch((q, from) => requests.search(props.event.id, q, from))

// The event page's payload carries the summary; ask the server only without it.
const summary = ref<XdebugTraceSummary | null>(props.event.payload.summary ?? null)
const summaryError = ref('')
const summaryLoading = ref(false)

const loadSummary = async () => {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    summary.value = (await requests.getSummary(props.event.id)).summary
  } catch (e) {
    summaryError.value = e instanceof Error ? e.message : String(e)
  } finally {
    summaryLoading.value = false
  }
}

onMounted(() => {
  tree.loadRoot()
  if (!summary.value) loadSummary()
})

const title = computed(() => traceTitle(props.event.payload))
const subtitle = computed(() => traceSubtitle(props.event.payload))

const stats = computed(() => {
  const p = props.event.payload
  const list = [
    { label: 'Duration', value: formatSeconds(p.duration) },
    { label: 'Peak memory', value: formatFileSize(p.peak_memory) },
    { label: 'Calls', value: p.calls.toLocaleString('en-US') },
  ]
  if (summary.value) list.push({ label: 'User calls', value: summary.value.user_calls.toLocaleString('en-US') })
  list.push(
    { label: 'Max depth', value: String(p.max_depth) },
    { label: 'Stored', value: formatFileSize(p.size) },
  )
  return list
})

const reveal = (hit: XdebugTraceNode) => tree.reveal(hit)
</script>

<template>
  <EventDetailLayout class="trace-page">
    <template #header>
      <div class="trace-page__header">
        <h2 class="trace-page__title">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="trace-page__script"
        >
          {{ subtitle }}
        </p>
        <dl class="trace-page__stats">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="trace-page__stat"
          >
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
          </div>
        </dl>
        <p
          v-if="event.payload.truncated"
          class="trace-page__cut"
          role="note"
        >
          The trace is cut: it hit the size limit or has no end. Calls after the cut are missing,
          and calls still running at that point show «no exit».
        </p>
      </div>
    </template>

    <PageTabs class="trace-page__tabs">
      <PageTab name="Call tree">
        <div class="trace-page__panel">
          <TraceSearch
            :search="search"
            @reveal="reveal"
          />
          <TraceTree :tree="tree" />
        </div>
      </PageTab>
      <PageTab name="Slowest & top">
        <div class="trace-page__panel">
          <p
            v-if="summaryLoading"
            class="trace-page__state"
            role="status"
          >
            Loading the summary…
          </p>
          <p
            v-else-if="summaryError"
            class="trace-page__state trace-page__state--error"
            role="alert"
          >
            Could not load the summary: {{ summaryError }}
            <button
              type="button"
              class="trace-page__retry"
              @click="loadSummary"
            >
              Retry
            </button>
          </p>
          <TraceSummary
            v-else-if="summary"
            :summary="summary"
          />
        </div>
      </PageTab>
    </PageTabs>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.trace-page__header {
  @apply flex flex-col gap-1;
}

.trace-page__title {
  @apply text-base font-mono font-semibold text-gray-900 dark:text-gray-100 break-all;
}

.trace-page__script {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400 break-all;
}

.trace-page__stats {
  @apply mt-1 flex flex-wrap gap-x-6 gap-y-1;
}

.trace-page__stat {
  @apply flex items-baseline gap-1.5 text-xs;

  dt {
    @apply text-gray-500 dark:text-gray-400;
  }

  dd {
    @apply font-mono font-medium text-gray-900 dark:text-gray-100;
  }
}

.trace-page__cut {
  @apply mt-2 px-2.5 py-1.5 rounded text-xs;
  @apply bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300;
}

.trace-page__panel {
  @apply flex flex-col gap-3 py-3;
}

.trace-page__state {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.trace-page__state--error {
  @apply text-red-700 dark:text-red-400;
}

.trace-page__retry {
  @apply ml-1 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-xs;
  @apply text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800;
}
</style>
