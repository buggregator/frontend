<script lang="ts" setup>
import { useElementSize } from '@vueuse/core'
import { computed, ref, useId, watch } from 'vue'
import { RouteName } from '@/shared/types'
import { useSentryRequests } from '../../lib'
import { layoutSequence } from '../../lib/trace-flow/flow-layout'
import { paletteColors } from '../../lib/trace-graph/trace-graph'
import type { SentryFlowRequest, SentrySequence } from '../../types'
import '../trace-graphs/trace-graph-theme.css'

// One request's calls as a sequence diagram (#6533 C, #6531): lifelines in
// call order, a call is a solid line with a filled arrowhead, a reply a dashed
// line with an open chevron, failed ones red with their status.

type Props = { request: SentryFlowRequest; colors: Map<string, string> }

const props = defineProps<Props>()

const { getTraceSequence } = useSentryRequests()
const sequence = ref<SentrySequence | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null
  try {
    sequence.value = await getTraceSequence(props.request.trace_id)
  } catch (e) {
    sequence.value = null
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
watch(() => props.request.trace_id, load, { immediate: true })

const box = ref<HTMLElement>()
const { width } = useElementSize(box)
const MIN_WIDTH = 640
const svgWidth = computed(() => Math.max(MIN_WIDTH, Math.floor(width.value)))
const layout = computed(() => (sequence.value ? layoutSequence(sequence.value, { width: svgWidth.value }) : null))
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
</script>

<template>
  <section
    class="trace-seq tg-scope"
    aria-label="Sequence of calls"
    data-test="trace-sequence"
  >
    <header class="trace-seq__head">
      <span class="trace-seq__title">Selected request</span>
      <code class="trace-seq__name">{{ request.name }}</code>
      <span
        v-if="request.is_error"
        class="trace-seq__err"
      >✕ error</span>
      <span class="trace-seq__muted">{{ Math.round(request.duration_ms) }} ms · sequence of calls</span>
      <RouterLink
        class="trace-seq__link"
        :to="{ name: RouteName.SentryTraceDetail, params: { traceId: request.trace_id } }"
      >
        Open trace
      </RouterLink>
    </header>

    <div
      ref="box"
      class="trace-seq__canvas tg-canvas"
    >
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
        This request made no calls to other services.
      </p>
      <svg
        v-else-if="layout"
        :width="svgWidth"
        :height="layout.height"
        role="img"
        :aria-label="`Sequence of ${sequence?.calls.length ?? 0} calls of ${request.name}`"
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
          <line
            :x1="a.fromX"
            :y1="a.y"
            :x2="a.kind === 'call' ? tip(a.fromX, a.toX) : a.toX"
            :y2="a.y"
            :class="['trace-seq__arrow', `trace-seq__arrow--${a.kind}`, { 'trace-seq__arrow--err': a.isError }]"
            :marker-end="`url(#${a.kind === 'call' ? (a.isError ? mk.err : mk.call) : a.isError ? mk.replyErr : mk.reply})`"
          />
          <text
            :x="Math.min(a.fromX, a.toX) + 12"
            :y="a.y - 7"
            :class="['trace-seq__label', { 'trace-seq__label--err': a.isError, 'trace-seq__label--late': a.late }]"
          >{{ fit(a.label, Math.abs(a.toX - a.fromX) - 24) }}<title>{{ a.label }}</title></text>
        </g>

        <text
          v-for="(n, i) in layout.notes"
          :key="`note-${i}`"
          :x="n.x + 12"
          :y="n.y"
          class="trace-seq__note"
        >{{ n.text }}</text>
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
  @apply rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800;
}

.trace-seq__head {
  @apply flex flex-wrap items-baseline gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs;
}

.trace-seq__title {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.trace-seq__name {
  @apply font-mono text-gray-900 dark:text-gray-100 break-all;
}

.trace-seq__err {
  @apply text-red-600 dark:text-red-400 font-semibold;
}

.trace-seq__muted {
  @apply text-2xs text-gray-600 dark:text-gray-400;
}

.trace-seq__link {
  @apply ml-auto text-2xs text-blue-600 dark:text-blue-400 hover:underline;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 rounded;
}

.trace-seq__canvas {
  @apply overflow-x-auto;

  svg {
    @apply block;
  }
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
