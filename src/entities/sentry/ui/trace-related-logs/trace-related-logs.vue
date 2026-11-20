<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { describeLoadError } from '@/shared/lib/io'
import { useSentryRequests } from '../../lib/use-sentry-requests'
import type { SentryLog } from '../../types'
import SentryLogRow from '../sentry-logs-list/sentry-log-row.vue'

// A trace's logs inline on the trace page (#6533 related-logs): the Logs rows,
// oldest first; «span →» opens the log's span in the Waterfall.

type Props = { traceId: string; spanIds: Set<string> }

const props = defineProps<Props>()
const emit = defineEmits<{ span: [spanId: string] }>()

const { getTraceLogs } = useSentryRequests()
const logs = ref<SentryLog[]>([])
const total = ref(0)
const page = ref(0)
const loading = ref(false)
const error = ref('')

let lastRequest = 0
const loadPage = async (next: number) => {
  const id = ++lastRequest
  const traceId = props.traceId
  loading.value = true
  error.value = ''
  try {
    const res = await getTraceLogs(traceId, next)
    if (id !== lastRequest) return
    const seen = new Set(next === 1 ? [] : logs.value.map((l) => l.id))
    logs.value = [...(next === 1 ? [] : logs.value), ...res.data.filter((l) => !seen.has(l.id))]
    total.value = res.meta.total
    page.value = next
  } catch (e) {
    if (id === lastRequest) error.value = describeLoadError(e)
  } finally {
    if (id === lastRequest) loading.value = false
  }
}
watch(() => props.traceId, () => loadPage(1), { immediate: true })

// Time order reads with the waterfall; the server lists newest first.
const ordered = computed(() =>
  [...logs.value].sort((a, b) => (a.log_ts ?? '').localeCompare(b.log_ts ?? ''))
)
const hasMore = computed(() => logs.value.length < total.value)
</script>

<template>
  <section
    class="trace-logs"
    aria-label="Logs of this trace"
    data-test="trace-related-logs"
  >
    <p
      v-if="loading && !logs.length"
      class="trace-logs__state"
    >
      Loading logs…
    </p>
    <p
      v-else-if="error && !logs.length"
      class="trace-logs__state"
    >
      Could not load the logs: {{ error }}
      <button
        type="button"
        class="trace-logs__link"
        @click="loadPage(1)"
      >
        Try again
      </button>
    </p>
    <p
      v-else-if="!logs.length"
      class="trace-logs__state"
    >
      No logs for this trace.
    </p>
    <template v-else>
      <SentryLogRow
        v-for="log in ordered"
        :key="log.id"
        :log="log"
        :trace-spans="spanIds"
        @span="emit('span', $event)"
      />
      <div
        v-if="hasMore || error"
        class="trace-logs__more"
      >
        <span
          v-if="error"
          class="trace-logs__err"
        >Could not load more: {{ error }}</span>
        <button
          type="button"
          class="trace-logs__link"
          :disabled="loading"
          data-test="trace-logs-more"
          @click="loadPage(page + 1)"
        >
          {{ loading ? 'Loading…' : `Show more (${total - logs.length} left)` }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.trace-logs {
  border: 1px solid var(--trace-logs-line, #e5e7eb);
  border-radius: 4px;
  overflow: hidden;
}

.dark .trace-logs {
  --trace-logs-line: #374151;
}

.trace-logs__state {
  margin: 0;
  padding: 16px;
  font-size: 0.75rem;
  color: #4b5563;
}

.dark .trace-logs__state {
  color: #9ca3af;
}

.trace-logs__more {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
}

.trace-logs__link {
  font-size: 0.75rem;
  color: #2563eb;
  border-radius: 4px;
}

.dark .trace-logs__link {
  color: #60a5fa;
}

.trace-logs__link:hover {
  text-decoration: underline;
}

.trace-logs__link:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.trace-logs__err {
  font-size: 0.75rem;
  color: #dc2626;
}
</style>
