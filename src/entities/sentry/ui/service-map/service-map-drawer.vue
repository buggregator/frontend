<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { RouteName } from '@/shared/types'
import {
  formatMs,
  formatPercent,
  formatRpm,
  serviceCalls,
  ERROR_LINE,
  type MapSelection,
  type ServiceMapModel
} from '../../lib/service-map/service-map-model'
import { useSentryRequests } from '../../lib/use-sentry-requests'
import type { SentryServiceMapTrace } from '../../types'
import ServiceMapDonut from './service-map-donut.vue'

// The panel beside the map (#6540, like Zipkin's drawer): a service's Uses /
// Used with a Traces button, or a line's numbers and the traces through it.

type Props = { model: ServiceMapModel; selection: NonNullable<MapSelection>; colors: Map<string, string> }

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; select: [sel: MapSelection] }>()

const node = computed(() =>
  props.selection.kind === 'node' ? props.model.nodes.find((n) => n.id === props.selection.id) ?? null : null
)
const edge = computed(() =>
  props.selection.kind === 'edge' ? props.model.edges.find((e) => e.id === props.selection.id) ?? null : null
)
const calls = computed(() => (node.value ? serviceCalls(props.model, node.value.id) : null))

// A line's traces: the first 20 come with the map, the rest on demand.
const { getServiceMapEdge } = useSentryRequests()
const traces = ref<SentryServiceMapTrace[]>([])
const loadingMore = ref(false)
const moreError = ref<string | null>(null)
watch(
  edge,
  (e) => {
    traces.value = e ? [...e.traces] : []
    moreError.value = null
  },
  { immediate: true }
)
const loadMore = async () => {
  const e = edge.value
  if (!e) return
  loadingMore.value = true
  moreError.value = null
  try {
    const res = await getServiceMapEdge({
      source: e.source,
      target: e.target,
      op_type: e.opType,
      limit: '50',
      offset: String(traces.value.length)
    })
    traces.value = [...traces.value, ...res.traces]
  } catch (err) {
    moreError.value = err instanceof Error ? err.message : String(err)
  } finally {
    loadingMore.value = false
  }
}

const time = (ts: string) => {
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour12: false })
}
const isErr = (rate: number) => rate >= ERROR_LINE
</script>

<template>
  <aside
    class="svc-drawer"
    :aria-label="node ? `Service ${node.label}` : 'Line'"
    data-test="svc-drawer"
  >
    <header class="svc-drawer__head">
      <template v-if="node">
        <span
          class="svc-drawer__swatch"
          :style="{ background: colors.get(node.id) ?? 'var(--tg-node-line)' }"
        />
        <h3 class="svc-drawer__title">
          {{ node.label }}
        </h3>
        <RouterLink
          v-if="!node.external"
          class="svc-drawer__traces"
          :to="{ name: RouteName.SentryTraces, query: { view: 'list', service: node.id } }"
          data-test="svc-drawer-traces"
        >
          Traces
        </RouterLink>
      </template>
      <h3
        v-else-if="edge"
        class="svc-drawer__title"
      >
        {{ edge.source }} → {{ edge.target }}
      </h3>
      <button
        type="button"
        class="svc-drawer__close"
        aria-label="Close the panel"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <div
      v-if="node && calls"
      class="svc-drawer__body"
    >
      <p
        v-if="node.external"
        class="svc-drawer__note"
      >
        {{ node.kind === 'database' ? 'Database' : 'External host' }}: sends no traces of its own, measured by the calls into it.
      </p>

      <section
        v-if="calls.uses.length"
        class="svc-drawer__section"
      >
        <h4 class="svc-drawer__h">
          Uses <span>traced requests</span>
        </h4>
        <div class="svc-drawer__chart">
          <ServiceMapDonut
            :slices="calls.uses"
            :colors="colors"
            label="Calls it makes"
          />
          <span>Calls {{ calls.uses.length }} service{{ calls.uses.length === 1 ? '' : 's' }}</span>
        </div>
        <table class="svc-drawer__table">
          <thead>
            <tr><th>Service</th><th>Calls</th><th>Errors</th><th>p95</th></tr>
          </thead>
          <tbody>
            <tr
              v-for="r in calls.uses"
              :key="r.edgeId"
            >
              <td>
                <button
                  type="button"
                  class="svc-drawer__row-btn"
                  @click="emit('select', { kind: 'edge', id: r.edgeId })"
                >
                  <span
                    class="svc-drawer__swatch svc-drawer__swatch--sm"
                    :style="{ background: colors.get(r.service) ?? 'var(--tg-node-line)' }"
                  />{{ r.service }}
                </button>
              </td>
              <td>{{ r.count }}</td>
              <td :class="{ 'svc-drawer__err': isErr(r.errorRate) }">
                {{ r.errors ? `✕ ${r.errors}` : '0' }}
              </td>
              <td>{{ formatMs(r.p95) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="svc-drawer__section">
        <h4 class="svc-drawer__h">
          Used <span>traced requests</span>
        </h4>
        <p
          v-if="calls.entryCount"
          class="svc-drawer__note"
        >
          Entry service: {{ calls.entryCount }} requests from clients.
        </p>
        <template v-if="calls.used.length">
          <div class="svc-drawer__chart">
            <ServiceMapDonut
              :slices="calls.used"
              :colors="colors"
              label="Calls into it"
            />
            <span>Called by {{ calls.used.length }} service{{ calls.used.length === 1 ? '' : 's' }}</span>
          </div>
          <table class="svc-drawer__table">
            <thead>
              <tr><th>Service</th><th>Calls</th><th>Errors</th><th>p95</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="r in calls.used"
                :key="r.edgeId"
              >
                <td>
                  <button
                    type="button"
                    class="svc-drawer__row-btn"
                    @click="emit('select', { kind: 'edge', id: r.edgeId })"
                  >
                    <span
                      class="svc-drawer__swatch svc-drawer__swatch--sm"
                      :style="{ background: colors.get(r.service) ?? 'var(--tg-node-line)' }"
                    />{{ r.service }}
                  </button>
                </td>
                <td>{{ r.count }}</td>
                <td :class="{ 'svc-drawer__err': isErr(r.errorRate) }">
                  {{ r.errors ? `✕ ${r.errors}` : '0' }}
                </td>
                <td>{{ formatMs(r.p95) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <p
          v-else-if="!calls.entryCount"
          class="svc-drawer__note"
        >
          No traced calls into it in this period.
        </p>
      </section>
    </div>

    <div
      v-else-if="edge"
      class="svc-drawer__body"
    >
      <dl class="svc-drawer__stats">
        <div><dt>Calls</dt><dd>{{ edge.count }} · {{ formatPercent(edge.share) }} of {{ edge.source }}</dd></div>
        <div>
          <dt>Errors</dt>
          <dd :class="{ 'svc-drawer__err': edge.isErr }">
            {{ edge.errors ? `✕ ${edge.errors} · ${formatPercent(edge.errorRate)}` : 'none' }}
          </dd>
        </div>
        <div><dt>p95</dt><dd>{{ formatMs(edge.p95) }}</dd></div>
        <div><dt>Per minute</dt><dd>{{ formatRpm(edge.count / (model.periodSeconds / 60)) }}</dd></div>
      </dl>

      <section class="svc-drawer__section">
        <h4 class="svc-drawer__h">
          Traces through this line <span>errors first</span>
        </h4>
        <ul class="svc-drawer__traces-list">
          <li
            v-for="t in traces"
            :key="t.trace_id"
          >
            <RouterLink
              class="svc-drawer__trace"
              :to="{ name: RouteName.SentryTraceDetail, params: { traceId: t.trace_id } }"
            >
              <span
                class="svc-drawer__trace-id"
                :class="{ 'svc-drawer__err': t.is_error }"
              >{{ t.is_error ? '✕ ' : '' }}{{ t.trace_id.slice(0, 12) }}</span>
              <span>{{ time(t.start_ts) }}</span>
              <span>{{ formatMs(t.duration_ms) }}</span>
            </RouterLink>
          </li>
        </ul>
        <p
          v-if="moreError"
          class="svc-drawer__note svc-drawer__err"
        >
          Could not load more: {{ moreError }}
        </p>
        <button
          v-if="traces.length < edge.traceCount"
          type="button"
          class="svc-drawer__more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading…' : `Show more (${edge.traceCount - traces.length} left)` }}
        </button>
      </section>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.svc-drawer {
  @apply flex flex-col text-xs overflow-hidden;
  background: var(--tg-node);
  color: var(--tg-strong);
}

.svc-drawer__head {
  @apply sticky top-0 flex items-center gap-2 px-4 py-2.5 flex-none;
  border-bottom: 1px solid var(--tg-pill-line);
  background: var(--tg-node);
}

.svc-drawer__swatch {
  @apply inline-block w-2.5 h-2.5 rounded-sm flex-none;
}

.svc-drawer__swatch--sm {
  @apply w-2 h-2 mr-1.5;
}

.svc-drawer__title {
  @apply flex-1 min-w-0 truncate font-mono text-[15px] font-semibold;
}

.svc-drawer__traces {
  @apply inline-flex items-center h-7 max-sm:h-11 px-3 rounded font-medium text-white bg-blue-600 hover:bg-blue-700;
  @apply dark:bg-blue-500 dark:text-gray-900 dark:hover:bg-blue-400;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-600;
}

.svc-drawer__close {
  @apply w-7 h-7 max-sm:w-11 max-sm:h-11 rounded text-lg leading-none;
  color: var(--tg-muted);

  &:hover {
    color: var(--tg-strong);
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600;
  }
}

.svc-drawer__body {
  @apply flex-1 overflow-auto px-4 py-3 space-y-5;
}

.svc-drawer__section {
  @apply space-y-2;
}

.svc-drawer__h {
  @apply text-xs font-semibold;

  span {
    @apply font-normal ml-1;
    color: var(--tg-muted);
  }
}

.svc-drawer__chart {
  @apply flex items-center gap-4;
  color: var(--tg-muted);
}

.svc-drawer__table {
  @apply w-full font-mono tabular-nums;

  th {
    @apply text-left font-sans font-normal py-1;
    color: var(--tg-muted);
  }

  th:not(:first-child),
  td:not(:first-child) {
    @apply text-right;
  }

  td {
    @apply py-1;
    border-top: 1px solid var(--tg-pill-line);
  }
}

.svc-drawer__row-btn {
  @apply inline-flex items-center text-left hover:underline;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 rounded-sm;
  }
}

.svc-drawer__err {
  color: var(--tg-err);
  @apply font-semibold;
}

.svc-drawer__note {
  color: var(--tg-muted);
}

.svc-drawer__stats {
  @apply grid grid-cols-2 gap-x-4 gap-y-2;

  dt {
    color: var(--tg-muted);
  }

  dd {
    @apply font-mono tabular-nums;
  }
}

.svc-drawer__traces-list {
  @apply font-mono tabular-nums;
}

.svc-drawer__trace {
  @apply grid grid-cols-[1fr_auto_4.5rem] gap-3 py-1.5 max-sm:py-3 hover:underline;
  border-top: 1px solid var(--tg-pill-line);

  span:not(:first-child) {
    @apply text-right;
    color: var(--tg-muted);
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 rounded-sm;
  }
}

.svc-drawer__more {
  @apply h-8 max-sm:h-11 px-3 rounded text-xs font-medium;
  border: 1px solid var(--tg-pill-line);

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600;
  }
}
</style>
