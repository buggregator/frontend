<script lang="ts" setup>
import { computed, ref, useId, watch } from 'vue'
import { usePanZoom } from '@/shared/lib/use-pan-zoom'
import { useSentryRequests } from '../../lib'
import { layoutSequence } from '../../lib/trace-graph/sequence-layout'
import { paletteColors } from '../../lib/trace-graph/trace-graph'
import type { SentrySequence } from '../../types'
import '../trace-graphs/trace-graph-theme.css'

// A trace's calls as a sequence diagram (trace page «Sequence» tab, #6533, #6531): lifelines in
// call order, a call is a solid line with a filled arrowhead, a reply a dashed
// line with an open chevron, failed ones red with their status.

type Props = { traceId: string; colors: Map<string, string> }

const props = defineProps<Props>()

const { getTraceSequence } = useSentryRequests()
const sequence = ref<SentrySequence | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    sequence.value = await getTraceSequence(props.traceId)
  } catch (e) {
    sequence.value = null
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
watch(() => props.traceId, load, { immediate: true })

// The diagram has its own width (a lane every LANE px), the view zooms and pans
// over it like the Call graph and fits it on open (seq-zoom, #6533).
const MIN_WIDTH = 640
const LANE = 240
const SIDE = 90
const diagramWidth = computed(() => {
  if (!sequence.value) return MIN_WIDTH
  const lanes = new Set(sequence.value.services)
  for (const c of sequence.value.calls) lanes.add(c.from).add(c.to)
  return Math.max(MIN_WIDTH, SIDE * 2 + (lanes.size - 1) * LANE)
})
// A huge trace stays drawable: the first MAX_CALLS calls, with a line saying so.
const MAX_CALLS = 300
const shown = computed(() =>
  sequence.value && sequence.value.calls.length > MAX_CALLS
    ? { ...sequence.value, calls: sequence.value.calls.slice(0, MAX_CALLS) }
    : sequence.value
)
const hiddenCalls = computed(() => (sequence.value?.calls.length ?? 0) - (shown.value?.calls.length ?? 0))
const layout = computed(() =>
  shown.value ? layoutSequence(shown.value, { width: diagramWidth.value, side: SIDE }) : null
)
const box = ref<HTMLElement>()
const contentSize = computed(() =>
  layout.value?.arrows.length ? { width: diagramWidth.value, height: layout.value.height + 8 } : null
)
const { transform, percent, dragging, zoomIn, zoomOut, fit: fitView, onKeydown } = usePanZoom(box, contentSize)
// External hosts get colours after the services.
const colorOf = computed(() =>
  paletteColors([...props.colors.keys(), ...(layout.value?.lifelines.map((l) => l.service) ?? [])])
)

const uid = useId()
const mk = { call: `seq-${uid}-call`, err: `seq-${uid}-err`, reply: `seq-${uid}-reply`, replyErr: `seq-${uid}-reply-err` }
// A label stays between its two lifelines: ~6.6 px per monospace character at 11 px.
const fit = (text: string, px: number) => {
  const max = Math.max(4, Math.floor(px / 6.6))
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
// The line stops short of the lifeline so the arrowhead tip touches it.
const tip = (fromX: number, toX: number) => toX + (toX > fromX ? -7 : 7)
// A call inside one service (from === to): a loop out to the right and back.
const selfLoop = (x: number, y: number) => `M ${x} ${y - 6} h 36 v 12 h -29`
</script>

<template>
  <section
    class="trace-seq tg-scope"
    aria-label="Sequence of calls"
    data-test="trace-sequence"
  >
    <header class="trace-seq__head">
      <span class="trace-seq__title">Sequence of calls</span>
      <span class="trace-seq__muted">calls in time order · a solid line is a call, a dashed one its reply</span>
      <span
        v-if="hiddenCalls > 0"
        class="trace-seq__muted"
        data-test="seq-capped"
      >· showing the first {{ MAX_CALLS }} of {{ sequence?.calls.length }} calls</span>
    </header>

    <div
      ref="box"
      class="trace-seq__canvas tg-canvas"
      :class="{ 'is-dragging': dragging }"
      :tabindex="contentSize ? 0 : undefined"
      :aria-label="contentSize ? 'Sequence diagram: drag or arrow keys to move, wheel or + and − to zoom, 0 to fit' : undefined"
      data-test="seq-canvas"
      @keydown="onKeydown"
    >
      <div
        v-if="contentSize"
        class="trace-seq__zoom"
        role="toolbar"
        aria-label="Zoom"
      >
        <button
          type="button"
          class="trace-seq__zoom-btn"
          aria-label="Zoom out"
          title="Zoom out (−)"
          data-test="seq-zoom-out"
          @click="zoomOut"
        >
          −
        </button>
        <span
          class="trace-seq__zoom-value"
          data-test="seq-zoom-value"
        >{{ percent }}%</span>
        <button
          type="button"
          class="trace-seq__zoom-btn"
          aria-label="Zoom in"
          title="Zoom in (+)"
          data-test="seq-zoom-in"
          @click="zoomIn"
        >
          +
        </button>
        <button
          type="button"
          class="trace-seq__zoom-btn trace-seq__zoom-btn--fit"
          title="Fit to view (0)"
          data-test="seq-zoom-fit"
          @click="fitView"
        >
          Fit
        </button>
      </div>
      <p
        v-if="loading && !layout"
        class="trace-seq__state"
      >
        Loading calls…
      </p>
      <p
        v-else-if="error"
        class="trace-seq__state"
      >
        Could not load the calls: {{ error }}
        <button
          type="button"
          class="trace-seq__link"
          @click="load"
        >
          Try again
        </button>
      </p>
      <p
        v-else-if="layout && !layout.arrows.length"
        class="trace-seq__state"
      >
        This trace made no calls to other services.
      </p>
      <svg
        v-else-if="layout"
        class="trace-seq__svg"
        role="img"
        :aria-label="`Sequence of ${sequence?.calls.length ?? 0} calls`"
      >
        <defs>
          <marker
            :id="mk.call"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
            refX="1"
            refY="6"
          ><path
            d="M0 0 12 6 0 12z"
            class="tg-marker--edge"
          /></marker>
          <marker
            :id="mk.err"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
            refX="1"
            refY="6"
          ><path
            d="M0 0 12 6 0 12z"
            class="tg-marker--err"
          /></marker>
          <marker
            :id="mk.reply"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
            refX="10"
            refY="6"
          ><path
            d="M1 1 11 6 1 11"
            fill="none"
            stroke-width="1.8"
            class="trace-seq__chevron"
          /></marker>
          <marker
            :id="mk.replyErr"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            markerUnits="userSpaceOnUse"
            orient="auto"
            refX="10"
            refY="6"
          ><path
            d="M1 1 11 6 1 11"
            fill="none"
            stroke-width="1.8"
            class="trace-seq__chevron trace-seq__chevron--err"
          /></marker>
        </defs>

        <g
          :transform="transform"
          data-test="seq-view"
        >
          <g
            v-for="l in layout.lifelines"
            :key="l.service"
          >
            <line
              :x1="l.x"
              :x2="l.x"
              y1="30"
              :y2="layout.height"
              class="trace-seq__lifeline"
            />
            <foreignObject
              :x="l.x - 80"
              y="2"
              width="160"
              height="26"
            >
              <div class="trace-seq__actor">
                <span
                  class="trace-seq__swatch"
                  :style="{ background: colorOf.get(l.service) }"
                />{{ l.service }}
              </div>
            </foreignObject>
          </g>

          <rect
            v-for="(a, i) in layout.activations"
            :key="`act-${i}`"
            :x="a.x - 5"
            :y="a.y1"
            width="10"
            :height="Math.max(6, a.y2 - a.y1)"
            rx="2"
            class="trace-seq__activation"
            :style="{ '--svc': colorOf.get(a.service) }"
          />

          <g
            v-for="(a, i) in layout.arrows"
            :key="`arrow-${i}`"
          >
            <path
              v-if="a.fromX === a.toX"
              :d="selfLoop(a.fromX, a.y)"
              fill="none"
              :class="['trace-seq__arrow', `trace-seq__arrow--${a.kind}`, { 'trace-seq__arrow--err': a.isError }]"
              :marker-end="`url(#${a.kind === 'call' ? (a.isError ? mk.err : mk.call) : a.isError ? mk.replyErr : mk.reply})`"
            />
            <line
              v-else
              :x1="a.fromX"
              :y1="a.y"
              :x2="a.kind === 'call' ? tip(a.fromX, a.toX) : a.toX"
              :y2="a.y"
              :class="['trace-seq__arrow', `trace-seq__arrow--${a.kind}`, { 'trace-seq__arrow--err': a.isError }]"
              :marker-end="`url(#${a.kind === 'call' ? (a.isError ? mk.err : mk.call) : a.isError ? mk.replyErr : mk.reply})`"
            />
            <text
              :x="Math.min(a.fromX, a.toX) + (a.fromX === a.toX ? 46 : 12)"
              :y="a.y - 7"
              :class="['trace-seq__label', { 'trace-seq__label--err': a.isError, 'trace-seq__label--late': a.late }]"
            >{{ fit(a.label, a.fromX === a.toX ? LANE - 60 : Math.abs(a.toX - a.fromX) - 24) }}<title>{{ a.label }}</title></text>
          </g>

          <text
            v-for="(n, i) in layout.notes"
            :key="`note-${i}`"
            :x="n.anchor === 'end' ? n.x - 12 : n.x + 12"
            :y="n.y"
            :text-anchor="n.anchor"
            class="trace-seq__note"
          >{{ n.text }}</text>
        </g>
      </svg>
    </div>

    <footer class="trace-seq__foot tg-key">
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
      /></svg>call</span>
      <span class="tg-key__item"><svg
        width="34"
        height="12"
        aria-hidden="true"
      ><line
        x1="0"
        y1="6"
        x2="30"
        y2="6"
        class="trace-seq__arrow trace-seq__arrow--reply"
      /><path
        d="M23 1 33 6 23 11"
        fill="none"
        stroke-width="1.8"
        class="trace-seq__chevron"
      /></svg>reply</span>
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
      /></svg>failed call or reply</span>
    </footer>
  </section>
</template>

<style lang="scss" scoped>
.trace-seq {
  @apply flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-800;
}

.trace-seq__head {
  @apply flex flex-none flex-wrap items-baseline gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs;
}

.trace-seq__title {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.trace-seq__muted {
  @apply text-2xs text-gray-600 dark:text-gray-400;
}

.trace-seq__link {
  @apply ml-auto text-2xs text-blue-600 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}

.trace-seq__canvas {
  @apply relative flex-1 min-h-[320px] overflow-hidden cursor-grab select-none;
  touch-action: none;

  &.is-dragging {
    @apply cursor-grabbing;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-rose-500/60;
  }
}

.trace-seq__svg {
  @apply absolute inset-0 block w-full h-full;
}

.trace-seq__zoom {
  @apply absolute top-2 right-2 z-10 flex items-center gap-0.5 p-0.5 rounded-md shadow-sm cursor-default;
  border: 1px solid var(--tg-node-line);
  background: var(--tg-node);
  color: var(--tg-strong);
}

.trace-seq__zoom-btn {
  @apply min-w-[28px] h-7 px-1.5 rounded text-sm leading-none hover:bg-gray-100 dark:hover:bg-gray-700;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60;
}

.trace-seq__zoom-btn--fit {
  @apply text-2xs font-semibold;
}

.trace-seq__zoom-value {
  @apply w-10 text-center font-mono text-2xs tabular-nums;
  color: var(--tg-muted);
}

.trace-seq__state {
  @apply px-3 py-6 text-xs text-gray-600 dark:text-gray-400;
}

.trace-seq__foot {
  @apply px-3 py-2 border-t border-gray-200 dark:border-gray-700;
}

.trace-seq__actor {
  @apply flex items-center justify-center gap-1.5 h-[26px] px-2 rounded font-mono text-xs font-semibold;
  border: 1px solid var(--tg-node-line);
  background: var(--tg-node);
  color: var(--tg-strong);
}

.trace-seq__swatch {
  @apply inline-block w-2 h-2 rounded-sm shrink-0;
}

.trace-seq__lifeline {
  stroke: var(--tg-node-line);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}

.trace-seq__activation {
  fill: color-mix(in srgb, var(--svc) 35%, transparent);
  stroke: var(--svc);
  stroke-width: 1;
}

.trace-seq__arrow {
  stroke: var(--tg-edge);
}

.trace-seq__arrow--call {
  stroke-width: 2;
}

.trace-seq__arrow--reply {
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}

.trace-seq__arrow--err {
  stroke: var(--tg-edge-err);
}

.trace-seq__chevron {
  stroke: var(--tg-edge);
}

.trace-seq__chevron--err {
  stroke: var(--tg-edge-err);
}

.trace-seq__label {
  font: 11px 'JetBrains Mono', ui-monospace, monospace;
  fill: var(--tg-strong);
  paint-order: stroke;
  stroke: var(--tg-canvas);
  stroke-width: 4px;
}

.trace-seq__label--err {
  fill: var(--tg-err);
}

.trace-seq__label--late {
  font-weight: 600;
}

.trace-seq__note {
  font: 11px 'JetBrains Mono', ui-monospace, monospace;
  fill: var(--tg-muted);
}
</style>
