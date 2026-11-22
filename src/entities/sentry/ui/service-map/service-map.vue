<script lang="ts" setup>
import { useElementSize, useMediaQuery, useThrottleFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'
import {
  boundsOf,
  buildServiceMap,
  formatMs,
  formatPercent,
  formatRpm,
  litPart,
  type HotSpotKind,
  type MapEdge,
  type MapSelection
} from '../../lib/service-map/service-map-model'
import { paletteColors } from '../../lib/trace-graph/trace-graph'
import { onSentryEvent } from '../../lib/use-sentry-events-bus'
import { useSentryRequests } from '../../lib/use-sentry-requests'
import { SERVICE_MAP_PAUSE_STORAGE } from '../../lib/use-sentry-view'
import type { SentryServiceMap } from '../../types'
import '../trace-graphs/trace-graph-theme.css'
import ServiceMapDrawer from './service-map-drawer.vue'
import ServiceMapPicker from './service-map-picker.vue'
import { useTrafficCanvas } from './use-traffic-canvas'

// Services and the calls between them over the header period (#6533 B, V1
// from #6540): particles show where the traffic goes (density = requests,
// red = failed, slower = higher p95); labels, tags and the hot-spot table
// say the same in numbers, so nothing depends on motion or colour.

const { getServiceMap } = useSentryRequests()
const { period, activeProjectKey } = storeToRefs(useEventsStore())

const data = ref<SentryServiceMap | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Only the latest request may write: a slow «7 days» reply must not replace
// a newer «15 min» one, nor one project's map another's.
let lastRequest = 0
const load = async () => {
  const id = ++lastRequest
  loading.value = true
  error.value = null
  try {
    const res = await getServiceMap()
    if (id === lastRequest) data.value = res
  } catch (e) {
    if (id === lastRequest) error.value = e instanceof Error ? e.message : String(e)
  } finally {
    if (id === lastRequest) loading.value = false
  }
}
onMounted(load)
watch([period, activeProjectKey], load)
onSentryEvent(useThrottleFn(load, 5000, true), ['trace'])

const model = computed(() => (data.value ? buildServiceMap(data.value) : null))
const colors = computed(() =>
  paletteColors([...(model.value?.nodes ?? [])].sort((a, b) => a.x - b.x || a.y - b.y).map((n) => n.id))
)

// Selection: a service or a line; the rest dims (V1).
const selection = ref<MapSelection>(null)
const lit = computed(() => (model.value ? litPart(model.value, selection.value) : null))
// Focus goes back to what opened the panel when it closes (#6549).
let opener: HTMLElement | null = null
const select = (sel: MapSelection) => {
  if (!selection.value && sel) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  selection.value = sel && selection.value?.kind === sel.kind && selection.value.id === sel.id ? null : sel
}
const closePanel = () => {
  selection.value = null
  const back = opener
  opener = null
  if (back?.isConnected) nextTick(() => back.focus())
}
watch(model, (m) => {
  // A refresh keeps the selection while it is still on the map.
  if (m && selection.value && !litPart(m, selection.value)) selection.value = null
})
const dimNode = (id: string) => !!lit.value && !lit.value.nodes.has(id)
const dimEdge = (id: string) => !!lit.value && !lit.value.edges.has(id)

// Motion: on by default on this view (#6540), Pause remembered per browser;
// reduced motion shows one still frame.
const PAUSE_KEY = SERVICE_MAP_PAUSE_STORAGE
const readPaused = () => {
  try {
    return window.localStorage.getItem(PAUSE_KEY) === '1'
  } catch {
    return false
  }
}
const paused = ref(readPaused())
const togglePause = () => {
  paused.value = !paused.value
  try {
    window.localStorage.setItem(PAUSE_KEY, paused.value ? '1' : '0')
  } catch {
    // Storage blocked: the choice lasts for this page.
  }
}
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const running = computed(() => !paused.value && !reducedMotion.value)

const canvas = ref<HTMLCanvasElement>()
useTrafficCanvas({ canvas, model, lit: computed(() => lit.value?.edges ?? null), running })

// Hot spots: tags on the lines and the table under the map.
const HOT_LABEL: Record<HotSpotKind, string> = { busiest: 'busiest', errors: 'most errors', slowest: 'slowest' }
const hotOf = computed(() => {
  const map = new Map<string, HotSpotKind[]>()
  for (const h of model.value?.hotSpots ?? []) map.set(h.edgeId, [...(map.get(h.edgeId) ?? []), h.kind])
  return map
})
const edgeById = computed(() => new Map((model.value?.edges ?? []).map((e) => [e.id, e])))
const hotText = (kind: HotSpotKind, e: MapEdge) => {
  const rpm = formatRpm(e.count / ((model.value?.periodSeconds ?? 60) / 60))
  if (kind === 'busiest') {
    const from = model.value?.nodes.find((n) => n.id === e.source)
    return `${e.count} of ${from?.outCount ?? e.count} calls from ${e.source} (${formatPercent(e.share)}) · ${rpm}/min`
  }
  if (kind === 'errors') return `✕ ${formatPercent(e.errorRate)} · ${e.errors} of ${e.count} calls failed`
  return `p95 ${formatMs(e.p95)} · particles move slower`
}

const edgeLabel = (e: MapEdge) =>
  `${e.source} to ${e.target}: ${e.count} calls, ${formatPercent(e.share)} of ${e.source}` +
  `${e.errors ? `, ${formatPercent(e.errorRate)} failed` : ', no errors'}, p95 ${formatMs(e.p95)}`

// Keep the selection and its neighbours in view beside the drawer.
const isPhone = useMediaQuery('(max-width: 639px)')
const scroller = ref<HTMLElement>()
const DRAWER_W = 380

// The whole map in view when it can be read (down to 70 %); wider maps pan.
const { width: scrollerWidth } = useElementSize(scroller)
const scale = computed(() => {
  const m = model.value
  if (!m || !scrollerWidth.value) return 1
  // Beside the open panel, not under it.
  const room = scrollerWidth.value - 8 - (selection.value && !isPhone.value ? DRAWER_W : 0)
  return Math.max(0.7, Math.min(1, room / m.width))
})
watch(selection, async (sel) => {
  await nextTick()
  const el = scroller.value
  const m = model.value
  if (!el || !m || !sel || !lit.value) return
  const box = boundsOf(m, lit.value.nodes)
  if (!box) return
  const k = scale.value
  const visibleW = el.clientWidth - (isPhone.value ? 0 : DRAWER_W)
  const left = box.w * k <= visibleW ? (box.x + box.w / 2) * k - visibleW / 2 : box.x * k - 24
  const top = (box.y + box.h / 2) * k - el.clientHeight / 2
  el.scrollTo?.({ left: Math.max(0, left), top: Math.max(0, top), behavior: reducedMotion.value ? 'auto' : 'smooth' })
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && selection.value) {
    closePanel()
    e.preventDefault()
  }
}

const uid = useId()
const mk = { edge: `svc-${uid}-edge`, err: `svc-${uid}-err` }
const serviceCount = computed(() => model.value?.nodes.length ?? 0)
</script>

<template>
  <div
    class="svc-map tg-scope"
    data-test="service-map"
    @keydown="onKeydown"
  >
    <section
      class="svc-map__panel"
      aria-label="Service map"
    >
      <header class="svc-map__head">
        <h2 class="svc-map__title">
          Service map
        </h2>
        <span class="svc-map__hint">requests go left → right · particles = requests, red = failed, slower = higher p95 · click a service</span>
        <button
          v-if="model && model.nodes.length"
          type="button"
          class="svc-map__pause"
          :aria-pressed="paused"
          :disabled="reducedMotion"
          :title="reducedMotion ? 'Motion is off: your system asks for reduced motion' : undefined"
          data-test="svc-map-pause"
          @click="togglePause"
        >
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              v-if="paused || reducedMotion"
              d="M4 3l9 5-9 5z"
            />
            <path
              v-else
              d="M4 3h3v10H4zM9 3h3v10H9z"
            />
          </svg>
          {{ paused || reducedMotion ? 'Play traffic' : 'Pause traffic' }}
        </button>
      </header>

      <p
        v-if="loading && !model"
        class="svc-map__state"
      >
        Loading the service map…
      </p>

      <StatusPanel
        v-else-if="error && !model"
        tone="error"
        title="Could not load the service map"
        :text="error"
        action-label="Try again"
        @action="load"
      />

      <p
        v-else-if="model && !model.nodes.length"
        class="svc-map__state"
        data-test="svc-map-empty"
      >
        No calls between services in this period. Send traces from two or more services, or pick a longer period.
      </p>

      <div
        v-else-if="model"
        class="svc-map__body"
      >
        <ServiceMapPicker
          class="svc-map__picker"
          :nodes="model.nodes"
          :colors="colors"
          :selected="selection?.kind === 'node' ? selection.id : null"
          @pick="selection = $event ? { kind: 'node', id: $event } : null"
        />

        <div
          ref="scroller"
          class="svc-map__scroller tg-canvas"
        >
          <div
            class="svc-map__fit"
            :style="{ width: `${model.width * scale}px`, height: `${model.height * scale}px` }"
          >
            <div
              class="svc-map__stage"
              role="group"
              :aria-label="`${serviceCount} services and ${model.edges.length} lines between them`"
              :style="{ width: `${model.width}px`, height: `${model.height}px`, transform: scale < 1 ? `scale(${scale})` : undefined }"
            >
              <svg
                class="svc-map__svg"
                :width="model.width"
                :height="model.height"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    :id="mk.edge"
                    viewBox="0 0 12 12"
                    markerWidth="12"
                    markerHeight="12"
                    markerUnits="userSpaceOnUse"
                    orient="auto"
                    refX="10"
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
                    refX="10"
                    refY="6"
                  ><path
                    d="M0 0 12 6 0 12z"
                    class="tg-marker--err"
                  /></marker>
                </defs>
                <path
                  v-for="en in model.entries"
                  :key="en.id"
                  :d="en.d"
                  class="svc-map__band"
                  :class="{ 'is-dim': dimEdge(en.id) }"
                  :stroke-width="en.band"
                  :marker-end="`url(#${mk.edge})`"
                />
                <path
                  v-for="e in model.edges"
                  :key="e.id"
                  :d="e.d"
                  class="svc-map__band"
                  :class="{ 'svc-map__band--err': e.isErr, 'is-dim': dimEdge(e.id) }"
                  :stroke-width="e.band"
                  :marker-end="`url(#${e.isErr ? mk.err : mk.edge})`"
                />
              </svg>

              <canvas
                ref="canvas"
                class="svc-map__particles"
                :style="{ width: `${model.width}px`, height: `${model.height}px` }"
                aria-hidden="true"
              />

              <span
                v-for="en in model.entries"
                :key="`l-${en.id}`"
                class="svc-map__entry"
                :class="{ 'is-dim': dimEdge(en.id) }"
                :style="{ left: `${en.label.x}px`, top: `${en.label.y}px` }"
              >clients<br>{{ en.count }} in</span>

              <button
                v-for="e in model.edges"
                :key="`l-${e.id}`"
                type="button"
                class="svc-map__label"
                :class="{
                  'svc-map__label--err': e.isErr,
                  'is-dim': dimEdge(e.id),
                  'is-on': selection?.kind === 'edge' && selection.id === e.id
                }"
                :style="{ left: `${e.label.x}px`, top: `${e.label.y}px` }"
                :aria-label="edgeLabel(e)"
                :aria-pressed="selection?.kind === 'edge' && selection.id === e.id"
                :data-test="`svc-edge-${e.source}-${e.target}`"
                @click="select({ kind: 'edge', id: e.id })"
              >
                <span
                  v-if="hotOf.get(e.id)"
                  class="svc-map__tags"
                >
                  <span
                    v-for="k in hotOf.get(e.id)"
                    :key="k"
                    class="svc-map__tag"
                    :class="`svc-map__tag--${k}`"
                  >{{ HOT_LABEL[k] }}</span>
                </span>
                <span>{{ e.count }} · {{ formatPercent(e.share) }}</span>
                <span
                  v-if="e.errors"
                  class="svc-map__label-err"
                >✕ {{ formatPercent(e.errorRate) }} err</span>
                <span>p95 {{ formatMs(e.p95) }}</span>
              </button>

              <button
                v-for="n in model.nodes"
                :key="n.id"
                type="button"
                class="svc-map__node"
                :class="{
                  'svc-map__node--err': n.hot,
                  'svc-map__node--external': n.external,
                  'is-dim': dimNode(n.id),
                  'is-on': selection?.kind === 'node' && selection.id === n.id
                }"
                :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px` }"
                :aria-pressed="selection?.kind === 'node' && selection.id === n.id"
                :data-test="`svc-node-${n.id}`"
                @click="select({ kind: 'node', id: n.id })"
              >
                <span class="svc-map__node-row">
                  <span
                    class="svc-map__swatch"
                    :style="{ background: colors.get(n.id) }"
                  />
                  <span class="svc-map__node-name">{{ n.label }}</span>
                </span>
                <span class="svc-map__node-row svc-map__node-meta">
                  <span>in {{ n.inCount }} · {{ formatRpm(n.rpm) }}/min</span>
                  <span v-if="n.outCount">out {{ n.outCount }}</span>
                </span>
                <span class="svc-map__node-row svc-map__node-meta">
                  <span
                    v-if="n.errorCount"
                    class="svc-map__node-err"
                  >✕ {{ formatPercent(n.errorRate) }} errors</span>
                  <span v-else>no errors</span>
                  <span
                    v-if="n.external"
                    class="svc-map__node-kind"
                  >{{ n.kind }}</span>
                  <span
                    v-else-if="n.hot"
                    class="svc-map__node-err"
                  >hot</span>
                </span>
                <span
                  class="svc-map__volume"
                  aria-hidden="true"
                ><span :style="{ width: `${Math.max(2, n.volume * 100)}%` }" /></span>
              </button>
            </div>
          </div>
        </div>

        <ServiceMapDrawer
          v-if="selection"
          class="svc-map__drawer"
          :model="model"
          :selection="selection"
          :colors="colors"
          @close="closePanel"
          @select="select"
        />
      </div>

      <footer
        v-if="model && model.nodes.length"
        class="svc-map__key tg-key"
      >
        <span class="tg-key__item"><svg
          width="34"
          height="10"
          aria-hidden="true"
        ><path
          d="M0 5h34"
          class="svc-map__key-band"
        /><circle
          cx="8"
          cy="5"
          r="1.5"
          class="svc-map__key-dot"
        /><circle
          cx="16"
          cy="5"
          r="1.5"
          class="svc-map__key-dot"
        /><circle
          cx="21"
          cy="5"
          r="1.5"
          class="svc-map__key-dot"
        /></svg>requests, denser = more</span>
        <span class="tg-key__item"><svg
          width="34"
          height="10"
          aria-hidden="true"
        ><path
          d="M0 5h34"
          class="svc-map__key-band"
        /><circle
          cx="17"
          cy="5"
          r="2.1"
          class="svc-map__key-err"
        /></svg>failed requests</span>
        <span class="tg-key__item"><svg
          width="34"
          height="10"
          aria-hidden="true"
        ><path
          d="M0 5h26"
          class="svc-map__key-line-err"
        /><path
          d="M24 1l8 4-8 4z"
          class="tg-marker--err"
        /></svg>line with ≥ 5% errors</span>
      </footer>
    </section>

    <section
      v-if="model && model.hotSpots.length"
      class="svc-map__hot"
      aria-label="Hot spots"
      data-test="svc-hot-spots"
    >
      <h3 class="svc-map__hot-title">
        Hot spots <span>this period · click to highlight</span>
      </h3>
      <ul>
        <li
          v-for="h in model.hotSpots"
          :key="h.kind"
        >
          <button
            type="button"
            class="svc-map__hot-row"
            :aria-pressed="selection?.kind === 'edge' && selection.id === h.edgeId"
            @click="select({ kind: 'edge', id: h.edgeId })"
          >
            <span
              class="svc-map__tag"
              :class="`svc-map__tag--${h.kind}`"
            >{{ HOT_LABEL[h.kind] }}</span>
            <span class="svc-map__hot-edge">{{ edgeById.get(h.edgeId)?.source }} → {{ edgeById.get(h.edgeId)?.target }}</span>
            <span class="svc-map__hot-text">{{ edgeById.get(h.edgeId) ? hotText(h.kind, edgeById.get(h.edgeId)!) : '' }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.svc-map {
  @apply flex flex-col gap-4 p-4 md:p-5 min-h-full;
}

.svc-map__panel,
.svc-map__hot {
  @apply rounded-md overflow-hidden bg-white dark:bg-gray-800;
  border: 1px solid var(--tg-pill-line);
}

.svc-map__head {
  @apply flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2;
  border-bottom: 1px solid var(--tg-pill-line);
}

.svc-map__title {
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.svc-map__hint {
  @apply text-xs text-gray-600 dark:text-gray-400 max-md:hidden;
}

.svc-map__pause {
  @apply ml-auto inline-flex items-center gap-1.5 h-7 max-sm:h-11 px-2.5 rounded text-xs font-medium;
  border: 1px solid var(--tg-pill-line);
  color: var(--tg-strong);

  &[aria-pressed='true'] {
    @apply bg-gray-100 dark:bg-gray-700;
  }

  &:disabled {
    @apply opacity-60 cursor-not-allowed;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.svc-map__state {
  @apply px-4 py-12 text-center text-sm text-gray-600 dark:text-gray-400;
}

.svc-map__body {
  @apply relative;

  @media (max-width: 639px) {
    @apply flex flex-col;
  }
}

.svc-map__picker {
  @apply absolute left-3 top-3 z-10;

  @media (max-width: 639px) {
    @apply static p-3 pb-0;
  }
}

.svc-map__scroller {
  @apply overflow-auto;
  height: clamp(420px, calc(100vh - 330px), 900px);

  @media (max-width: 639px) {
    @apply order-last;
    height: 460px;
  }
}

.svc-map__fit {
  @apply relative;
}

.svc-map__stage {
  @apply relative;
  transform-origin: 0 0;
}

.svc-map__svg,
.svc-map__particles {
  @apply absolute left-0 top-0 pointer-events-none;
}

.svc-map__band {
  fill: none;
  stroke: var(--tg-edge);
  stroke-opacity: var(--tg-band-op);
  transition: opacity 120ms;
}

.svc-map__band--err {
  stroke: var(--tg-edge-err);
}

.is-dim {
  opacity: var(--tg-dim);
}

.svc-map__entry {
  @apply absolute font-mono text-[11px] leading-[14px] -translate-y-full;
  color: var(--tg-muted);
}

.svc-map__label {
  @apply absolute flex flex-col items-start px-1.5 py-0.5 rounded-[3px] font-mono text-[11px] leading-[14px] whitespace-nowrap;
  transform: translate(-50%, -50%);
  border: 1px solid var(--tg-pill-line);
  background: var(--tg-pill);
  color: var(--tg-strong);
  transition: opacity 120ms;

  &.is-on {
    border: 2px solid var(--tg-edge-hi);
  }

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: 2px;
  }
}

.svc-map__label--err {
  border-color: var(--tg-edge-err);
}

.svc-map__label-err {
  color: var(--tg-err);
  @apply font-semibold;
}

.svc-map__tags {
  @apply absolute left-1/2 -translate-x-1/2 flex gap-1;
  bottom: calc(100% + 5px);
}

.svc-map__tag {
  @apply inline-block px-1.5 rounded-[3px] font-mono text-[11px] leading-4 font-semibold whitespace-nowrap;
}

.svc-map__tag--busiest {
  @apply bg-gray-900 text-gray-50 dark:bg-gray-100 dark:text-gray-900;
}

.svc-map__tag--errors {
  @apply bg-red-600 text-white dark:bg-red-400 dark:text-gray-900;
}

.svc-map__tag--slowest {
  @apply bg-amber-700 text-white dark:bg-amber-400 dark:text-gray-900;
}

.svc-map__node {
  @apply absolute flex flex-col gap-0.5 px-2.5 py-2 rounded-md text-left font-mono;
  border: 1px solid var(--tg-node-line);
  background: var(--tg-node);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  transition: opacity 120ms;

  &.is-on {
    border: 2px solid var(--tg-edge-hi);
  }

  &:focus-visible {
    outline: 2px solid #f43f5e;
    outline-offset: 2px;
  }
}

.svc-map__node--err,
.svc-map__node--err.is-on {
  border-color: var(--tg-edge-err);
  border-width: 1.5px;
}

.svc-map__node--external {
  border-style: dashed;
}

.svc-map__node-row {
  @apply flex items-center justify-between gap-2 min-w-0;
}

.svc-map__swatch {
  @apply w-2 h-2 rounded-sm flex-none;
}

.svc-map__node-name {
  @apply flex-1 min-w-0 truncate text-xs font-semibold;
  color: var(--tg-strong);
}

.svc-map__node-meta {
  @apply text-[11px] leading-4 whitespace-nowrap;
  color: var(--tg-muted);
}

.svc-map__node-err {
  color: var(--tg-err);
  @apply font-semibold;
}

.svc-map__node-kind {
  @apply italic;
}

.svc-map__volume {
  @apply block mt-auto h-1.5 rounded-sm overflow-hidden;
  background: var(--tg-canvas-dot);

  span {
    @apply block h-full;
    background: var(--tg-muted);
  }
}

.svc-map__drawer {
  @apply absolute right-0 top-0 bottom-0 z-10;
  width: 380px;
  border-left: 1px solid var(--tg-pill-line);

  @media (max-width: 639px) {
    @apply static w-auto m-3 mb-0 rounded-md;
    border: 1px solid var(--tg-pill-line);
    max-height: 70vh;
  }
}

.svc-map__key {
  @apply px-4 py-2;
  border-top: 1px solid var(--tg-pill-line);
}

.svc-map__key-band {
  stroke: var(--tg-edge);
  stroke-opacity: var(--tg-band-op);
  stroke-width: 8;
}

.svc-map__key-dot {
  fill: var(--tg-dot);
}

.svc-map__key-err {
  fill: var(--tg-edge-err);
  stroke: var(--tg-canvas);
  stroke-width: 1.5;
}

.svc-map__key-line-err {
  stroke: var(--tg-edge-err);
  stroke-width: 2;
}

.svc-map__hot-title {
  @apply px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100;
  border-bottom: 1px solid var(--tg-pill-line);

  span {
    @apply ml-1 text-xs font-normal text-gray-600 dark:text-gray-400;
  }
}

.svc-map__hot-row {
  @apply grid w-full items-center gap-x-4 gap-y-1 px-4 py-2 max-sm:py-3 text-left text-xs;
  grid-template-columns: 7rem minmax(0, 1fr) minmax(0, 1.4fr);
  color: var(--tg-strong);

  li + li & {
    border-top: 1px solid var(--tg-pill-line);
  }

  &:hover,
  &[aria-pressed='true'] {
    @apply bg-gray-50 dark:bg-gray-700/50;
  }

  &:focus-visible {
    @apply outline-none ring-2 ring-inset ring-blue-600;
  }

  @media (max-width: 639px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

.svc-map__hot-row .svc-map__tag {
  @apply justify-self-start;
}

.svc-map__hot-edge {
  @apply font-mono truncate;
}

.svc-map__hot-text {
  color: var(--tg-muted);

  @media (max-width: 639px) {
    @apply col-span-2;
  }
}
</style>
