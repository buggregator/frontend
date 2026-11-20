<script lang="ts" setup>
import { useElementSize, useThrottleFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'
import { onSentryEvent, useSentryRequests } from '../../lib'
import { layoutFlow } from '../../lib/trace-flow/flow-layout'
import { paletteColors } from '../../lib/trace-graph/trace-graph'
import type { SentryFlow } from '../../types'
import '../trace-graphs/trace-graph-theme.css'
import TraceSequence from './trace-sequence.vue'

// Requests across services over the header period (#6533 C, #6531): a lane per
// service, callers on top; one stroke per request runs down through the
// services it touched, failed ones red. Click a stroke (or use ←/→ on the
// plot) to see its calls as a sequence below.

const { getFlow } = useSentryRequests()
const { period } = storeToRefs(useEventsStore())

const flow = ref<SentryFlow | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedId = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    flow.value = await getFlow()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(period, load)
// New traces arrive in bursts: refresh at most every 5 s.
onSentryEvent(useThrottleFn(load, 5000, true), ['trace'])

const box = ref<HTMLElement>()
const { width } = useElementSize(box)
const MIN_WIDTH = 720
const LANE = 60
const TOP = 20
const BARS = 44
const svgWidth = computed(() => Math.max(MIN_WIDTH, Math.floor(width.value)))
const layout = computed(() => (flow.value ? layoutFlow(flow.value, { width: svgWidth.value, laneHeight: LANE, top: TOP, left: 180 }) : null))
const colors = computed(() => paletteColors(layout.value?.lanes.map((l) => l.service) ?? []))
const axisY = computed(() => (layout.value ? layout.value.height + 8 : 0))
const barsTop = computed(() => axisY.value + 22)
const maxCount = computed(() => Math.max(1, ...(layout.value?.bars.map((b) => b.count) ?? [1])))
const svgHeight = computed(() => barsTop.value + BARS + 8)

// Newest first from the server; keyboard moves through time order.
const ordered = computed(() => [...(layout.value?.strokes ?? [])].sort((a, b) => a.x - b.x))
const selected = computed(() => flow.value?.requests.find((r) => r.trace_id === selectedId.value) ?? null)
const select = (id: string) => {
  selectedId.value = selectedId.value === id ? null : id
}
const onKey = (e: KeyboardEvent) => {
  const list = ordered.value
  if (!list.length) return
  const i = list.findIndex((s) => s.traceId === selectedId.value)
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    const next = i < 0 ? (e.key === 'ArrowRight' ? 0 : list.length - 1) : i + (e.key === 'ArrowRight' ? 1 : -1)
    selectedId.value = list[Math.min(list.length - 1, Math.max(0, next))].traceId
  } else if (e.key === 'Escape') selectedId.value = null
}

// Newest requests are on the right: on a narrow screen start scrolled there.
watch(
  () => !!layout.value,
  async (ready) => {
    if (!ready) return
    await nextTick()
    if (box.value) box.value.scrollLeft = box.value.scrollWidth
  }
)

const uid = useId()
const mk = { edge: `flow-${uid}-edge`, err: `flow-${uid}-err`, hi: `flow-${uid}-hi` }
// Stroke ends short of the callee's dot so the arrowhead tip touches it.
const segEnd = (y2: number, big: boolean) => y2 - (big ? 15 : 9)
</script>

<template>
  <section
    class="trace-flow tg-scope"
    aria-label="Requests across services over time"
    data-test="trace-flow"
  >
    <header class="trace-flow__head">
      <span class="trace-flow__title">Requests across services over time</span>
      <span class="trace-flow__muted">one stroke = one request · calls go down, caller → callee · ←/→ to step</span>
      <span
        v-if="flow"
        class="trace-flow__muted trace-flow__count"
        data-test="trace-flow-count"
      >{{ flow.truncated ? `newest ${flow.requests.length} of ${flow.total}` : `${flow.total}` }} requests</span>
    </header>

    <div
      v-if="loading && !flow"
      class="trace-flow__state"
    >
      Loading requests…
    </div>
    <StatusPanel
      v-else-if="error && !flow"
      tone="error"
      title="Could not load the request flow"
      :text="error"
      action-label="Try again"
      @action="load"
    />
    <div
      v-else-if="flow && !flow.requests.length"
      class="trace-flow__state"
      data-test="trace-flow-empty"
    >
      No requests in this period.
    </div>

    <div
      v-else
      ref="box"
      class="trace-flow__canvas tg-canvas"
    >
      <svg
        v-if="layout"
        :width="svgWidth"
        :height="svgHeight"
        tabindex="0"
        role="listbox"
        :aria-label="`${layout.strokes.length} requests. Use the left and right arrows to pick one.`"
        :aria-activedescendant="selectedId ? `flow-${uid}-${selectedId}` : undefined"
        class="trace-flow__svg"
        @keydown="onKey"
      >
        <defs>
          <marker
            v-for="(id, kind) in mk"
            :id="id"
            :key="id"
            viewBox="0 0 12 12"
            :markerWidth="kind === 'hi' ? 12 : 7"
            :markerHeight="kind === 'hi' ? 12 : 7"
            markerUnits="userSpaceOnUse"
            orient="auto"
            refX="1"
            refY="6"
          >
            <path
              d="M0 0 12 6 0 12z"
              :class="`tg-marker--${kind}`"
            />
          </marker>
        </defs>

        <!-- Direction, once: from the first lane to the last. -->
        <g v-if="layout.lanes.length > 1">
          <line
            x1="12"
            :y1="layout.lanes[0].y"
            x2="12"
            :y2="layout.lanes[layout.lanes.length - 1].y - 12"
            class="tg-edge"
            :marker-end="`url(#${mk.edge})`"
          />
        </g>

        <g
          v-for="lane in layout.lanes"
          :key="lane.service"
        >
          <line
            :x1="layout.plotLeft"
            :x2="layout.plotRight"
            :y1="lane.y"
            :y2="lane.y"
            class="trace-flow__lane"
          />
          <rect
            :x="layout.plotLeft - 154"
            :y="lane.y - 4"
            width="8"
            height="8"
            rx="2"
            :fill="colors.get(lane.service)"
          />
          <text
            :x="layout.plotLeft - 140"
            :y="lane.y + 4"
            class="trace-flow__lane-name"
          >{{ lane.service.length > 17 ? `${lane.service.slice(0, 16)}…` : lane.service }}<title>{{ lane.service }}</title></text>
        </g>

        <g
          v-for="s in layout.strokes"
          :id="`flow-${uid}-${s.traceId}`"
          :key="s.traceId"
          role="option"
          :aria-selected="s.traceId === selectedId"
          :aria-label="`${s.name}, ${Math.round(s.durationMs)} ms${s.isError ? ', error' : ''}`"
          class="trace-flow__stroke"
          :class="{ 'trace-flow__stroke--err': s.isError, 'trace-flow__stroke--sel': s.traceId === selectedId }"
          @click="select(s.traceId)"
        >
          <title>{{ s.name }} · {{ Math.round(s.durationMs) }} ms{{ s.isError ? ' · error' : '' }}</title>
          <rect
            :x="s.x - 5"
            :y="(s.dots[0] ?? 0) - 6"
            width="10"
            :height="(s.dots[s.dots.length - 1] ?? 0) - (s.dots[0] ?? 0) + 12"
            class="trace-flow__hit"
          />
          <line
            v-for="(seg, i) in s.segments"
            :key="i"
            :x1="s.x"
            :x2="s.x"
            :y1="seg.y1"
            :y2="segEnd(seg.y2, s.traceId === selectedId)"
            class="trace-flow__seg"
            :marker-end="`url(#${s.traceId === selectedId ? mk.hi : s.isError ? mk.err : mk.edge})`"
          />
          <circle
            v-for="y in s.dots"
            :key="`d${y}`"
            :cx="s.x"
            :cy="y"
            :r="s.traceId === selectedId ? 4 : 2.5"
            class="trace-flow__dot"
          />
        </g>

        <line
          :x1="layout.plotLeft"
          :x2="layout.plotRight"
          :y1="axisY"
          :y2="axisY"
          class="trace-flow__axis"
        />
        <text
          v-for="t in layout.ticks"
          :key="t.x"
          :x="t.x"
          :y="axisY + 14"
          text-anchor="middle"
          class="trace-flow__tick"
        >{{ t.label }}</text>

        <text
          :x="layout.plotLeft - 12"
          :y="barsTop + BARS / 2 + 4"
          text-anchor="end"
          class="trace-flow__tick"
        >req / {{ flow!.bucket_seconds >= 60 ? `${flow!.bucket_seconds / 60} min` : `${flow!.bucket_seconds} s` }}</text>
        <g
          v-for="b in layout.bars"
          :key="b.t"
        >
          <title>{{ b.count }} requests, {{ b.errors }} failed</title>
          <rect
            :x="b.x"
            :y="barsTop + BARS - (b.count / maxCount) * BARS"
            :width="b.width"
            :height="(b.count / maxCount) * BARS"
            class="trace-flow__bar"
          />
          <rect
            v-if="b.errors"
            :x="b.x"
            :y="barsTop + BARS - Math.max(2, (b.errors / maxCount) * BARS)"
            :width="b.width"
            :height="Math.max(2, (b.errors / maxCount) * BARS)"
            class="trace-flow__bar--err"
          />
        </g>
      </svg>
    </div>

    <footer
      v-if="layout"
      class="trace-flow__foot tg-key"
    >
      <span class="tg-key__item"><svg
        width="34"
        height="12"
        aria-hidden="true"
      ><line
        x1="0"
        y1="6"
        x2="22"
        y2="6"
        class="tg-edge"
      /><path
        d="M22 0 34 6 22 12z"
        class="tg-marker--edge"
      /></svg>call, caller → callee</span>
      <span class="tg-key__item"><svg
        width="34"
        height="12"
        aria-hidden="true"
      ><line
        x1="0"
        y1="6"
        x2="22"
        y2="6"
        class="tg-edge tg-edge--err"
      /><path
        d="M22 0 34 6 22 12z"
        class="tg-marker--err"
      /></svg>failed request</span>
      <span class="tg-key__item"><svg
        width="34"
        height="12"
        aria-hidden="true"
      ><line
        x1="0"
        y1="6"
        x2="22"
        y2="6"
        class="tg-edge tg-edge--hi"
      /><path
        d="M22 0 34 6 22 12z"
        class="tg-marker--hi"
      /></svg>selected</span>
    </footer>
  </section>

  <TraceSequence
    v-if="selected"
    class="mt-4"
    :request="selected"
    :colors="colors"
  />
</template>

<style lang="scss" scoped>
.trace-flow {
  @apply rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800;
}

.trace-flow__head {
  @apply flex flex-wrap items-baseline gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700;
}

.trace-flow__title {
  @apply text-xs font-semibold text-gray-900 dark:text-gray-100;
}

.trace-flow__muted {
  @apply text-2xs text-gray-600 dark:text-gray-400;
}

.trace-flow__count {
  @apply ml-auto;
}

.trace-flow__state {
  @apply flex items-center justify-center py-12 text-sm text-gray-600 dark:text-gray-400;
}

.trace-flow__canvas {
  @apply overflow-x-auto;
}

.trace-flow__svg {
  @apply block;

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: -2px;
  }
}

.trace-flow__foot {
  @apply px-3 py-2 border-t border-gray-200 dark:border-gray-700;
}

.trace-flow__lane {
  stroke: var(--tg-node-line);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}

.trace-flow__lane-name {
  font: 600 12px 'JetBrains Mono', ui-monospace, monospace;
  fill: var(--tg-strong);
}

.trace-flow__stroke {
  cursor: pointer;
  opacity: 0.55;
}

.trace-flow__stroke:hover {
  opacity: 1;
}

.trace-flow__stroke--err {
  opacity: 0.9;
}

.trace-flow__stroke--sel {
  opacity: 1;
}

.trace-flow__hit {
  fill: transparent;
}

.trace-flow__seg {
  stroke: var(--tg-edge);
  stroke-width: 1.5;
}

.trace-flow__dot {
  fill: var(--tg-edge);
}

.trace-flow__stroke--err .trace-flow__seg {
  stroke: var(--tg-edge-err);
}

.trace-flow__stroke--err .trace-flow__dot {
  fill: var(--tg-edge-err);
}

.trace-flow__stroke--sel .trace-flow__seg {
  stroke: var(--tg-edge-hi);
  stroke-width: 3;
}

.trace-flow__stroke--sel .trace-flow__dot {
  fill: var(--tg-edge-hi);
}

.trace-flow__axis {
  stroke: var(--tg-node-line);
}

.trace-flow__tick {
  font: 11px 'JetBrains Mono', ui-monospace, monospace;
  fill: var(--tg-muted);
}

.trace-flow__bar {
  fill: var(--tg-node-line);
  opacity: 0.6;
}

.trace-flow__bar--err {
  fill: var(--tg-edge-err);
}
</style>
